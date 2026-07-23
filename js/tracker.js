(function(){
  var state={
    status:"not-loaded",
    region:null,
    today:null,
    tomorrow:null,
    lastUpdated:null,
    nextCheck:null
  };

  function postcodeUrl(){
    return "https://api.octopus.energy/v1/industry/grid-supply-points/?postcode="+
      encodeURIComponent(window.HG_CONFIG.trackerPostcode);
  }

  function ratesUrl(region){
    var product=window.HG_CONFIG.trackerProductCode;
    var tariff="E-1R-"+product+"-"+region;

    return "https://api.octopus.energy/v1/products/"+
      encodeURIComponent(product)+
      "/electricity-tariffs/"+
      encodeURIComponent(tariff)+
      "/standard-unit-rates/?page_size=10";
  }

  function getJSON(url,force){
    return fetch(url,{cache:force?"reload":"no-cache"}).then(function(response){
      if(!response.ok){
        throw new Error("Octopus HTTP "+response.status);
      }
      return response.json();
    });
  }

  function getRegion(force){
    return getJSON(postcodeUrl(),force).then(function(data){
      if(!data.results || !data.results.length || !data.results[0].group_id){
        throw new Error("Octopus region unavailable");
      }

      // Same conversion as the working Scriptable shortcut.
      return String(data.results[0].group_id).replace("_","");
    });
  }

  function getRates(region,force){
    return getJSON(ratesUrl(region),force).then(function(data){
      return data.results || [];
    });
  }

  function londonDateKey(value){
    var parts=new Intl.DateTimeFormat("en-CA",{
      timeZone:"Europe/London",
      year:"numeric",
      month:"2-digit",
      day:"2-digit"
    }).formatToParts(new Date(value));

    var y="",m="",d="";
    parts.forEach(function(part){
      if(part.type==="year") y=part.value;
      if(part.type==="month") m=part.value;
      if(part.type==="day") d=part.value;
    });
    return y+"-"+m+"-"+d;
  }

  function tomorrowKey(){
    var now=new Date();
    var todayKey=londonDateKey(now);
    var probe=new Date(now.getTime()+24*60*60*1000);

    // Advance until the Europe/London calendar date changes.
    while(londonDateKey(probe)===todayKey){
      probe=new Date(probe.getTime()+60*60*1000);
    }
    return londonDateKey(probe);
  }

  function readTodayTomorrow(results){
    var todayKey=londonDateKey(new Date());
    var nextKey=tomorrowKey();
    var today=null;
    var tomorrow=null;

    (results||[]).forEach(function(row){
      if(row.value_inc_vat===undefined || !row.valid_from) return;

      var dateKey=londonDateKey(row.valid_from);
      var price=Number(row.value_inc_vat);

      if(dateKey===todayKey && isFinite(price)) today=price;
      if(dateKey===nextKey && isFinite(price)) tomorrow=price;
    });

    return {today:today,tomorrow:tomorrow};
  }

  function load(force){
    if(!window.HG_CONFIG.trackerEnabled){
      state.status="disabled";
      return Promise.resolve(state);
    }

    state.status="loading";

    return getRegion(!!force)
      .then(function(region){
        state.region=region;
        return getRates(region,!!force);
      })
      .then(function(results){
        var prices=readTodayTomorrow(results);

        state.today=isFinite(prices.today)?prices.today:null;
        state.tomorrow=isFinite(prices.tomorrow)?prices.tomorrow:null;
        state.status=state.today===null?"no-price":"ok";
        state.lastUpdated=new Date();
        state.nextCheck=new Date(
          Date.now()+(window.HG_CONFIG.trackerRefreshMinutes||30)*60000
        );

        return state;
      })
      .catch(function(error){
        console.error("Tracker:",error);
        state.status="failed";
        state.today=null;
        state.tomorrow=null;
        state.lastUpdated=new Date();
        state.nextCheck=new Date(
          Date.now()+(window.HG_CONFIG.trackerRefreshMinutes||30)*60000
        );
        return state;
      });
  }

  function getState(){
    return state;
  }

  window.HomeGlanceTracker={
    load:load,
    getState:getState,
    source:"Octopus Energy public tariff API"
  };
})();