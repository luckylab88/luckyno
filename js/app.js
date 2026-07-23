(function(){
  var lastUpdated=null,lastWeather=null,officialWarning=null;

  function el(id){return document.getElementById(id);}
  function pad(n){return n<10?"0"+n:""+n;}
  function formatDate(d){
    var days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
      months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return days[d.getDay()]+" · "+d.getDate()+" "+months[d.getMonth()]+" "+d.getFullYear();
  }
  function timeInZone(zone){
    return new Intl.DateTimeFormat("en-GB",{
      timeZone:zone,hour:"2-digit",minute:"2-digit",hour12:false
    }).format(new Date());
  }
  function nudgePage(){
    var p=el("page"); if(!p)return;
    var offsets=[[-1,0],[0,1],[1,0],[0,-1],[1,1],[-1,-1],[0,0]],
      o=offsets[new Date().getMinutes()%offsets.length];
    p.style.transform="translate("+o[0]+"px,"+o[1]+"px)";
  }

  function updateCalendar(d){
    el("lunar").textContent=window.HomeGlanceLunar.getText(d);
    var term=window.HomeGlanceLunar.getSolarTerm(d),wrap=el("solar-term-wrap");
    if(window.HG_CONFIG.showSolarTerm && term){
      el("solar-term").textContent=term;
      wrap.style.display="inline";
    }else{
      wrap.style.display="none";
    }
  }

  function updateClock(){
    var d=new Date(),h=pad(d.getHours()),m=pad(d.getMinutes());
    el("time").innerHTML=h+'<span class="colon">:</span>'+m;
    el("date").textContent=formatDate(d);
    el("hk-time").textContent="HK "+timeInZone("Asia/Hong_Kong");
    el("ny-time").textContent="NY "+timeInZone("America/New_York");
    updateCalendar(d);
    if(lastWeather) updateSunEvent(lastWeather,d);
    nudgePage();
    updateUpdatedText();
  }

  function updateSunEvent(w,now){
    var sunrise=new Date(w.sunrise),sunset=new Date(w.sunset),
      label,time;
    if(now<sunrise){
      label="Sunrise"; time=window.HomeGlanceWeather.timePart(w.sunrise);
    }else if(now<sunset){
      label="Sunset"; time=window.HomeGlanceWeather.timePart(w.sunset);
    }else{
      label="Sunrise"; time=window.HomeGlanceWeather.timePart(w.nextSunrise);
    }
    el("sunset").textContent=label+" "+time;
  }

  function updateUpdatedText(){
    if(!lastUpdated)return;
    var mins=Math.floor((new Date()-lastUpdated)/60000),footer=el("updated");
    if(mins<1) footer.textContent="Updated just now";
    else if(mins<60) footer.textContent="Updated "+mins+" min ago";
    else footer.textContent="Updated "+Math.floor(mins/60)+" hr ago";
    footer.className=mins>=30?"stale":"";
  }

  function dayName(s){
    var d=new Date(s+"T12:00:00");
    return["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
  }

  function renderForecast(days){
    var grid=el("forecast-grid"); grid.innerHTML="";
    var lows=days.map(function(d){return d.low;}),
      highs=days.map(function(d){return d.high;}),
      min=Math.min.apply(null,lows),max=Math.max.apply(null,highs),
      range=Math.max(1,max-min);
    days.forEach(function(d){
      var row=document.createElement("div");
      row.className="forecast-row";
      var start=Math.round(((d.low-min)/range)*100),
        width=Math.max(10,Math.round(((d.high-d.low)/range)*100));
      row.innerHTML="<div>"+dayName(d.date)+"</div>"+
        "<div class='forecast-icon'>"+d.icon+"</div>"+
        "<div>"+d.low+"°</div>"+
        "<div class='bar'><div class='bar-fill' style='left:"+start+"%;width:"+width+"%'></div></div>"+
        "<div>"+d.high+"°</div>";
      grid.appendChild(row);
    });
  }

  function uvColor(uv){
    if(uv<=2)return"#2e7d32";
    if(uv<=5)return"#b8860b";
    if(uv<=7)return"#d2691e";
    if(uv<=10)return"#b22222";
    return"#6a1b9a";
  }

  function renderNotice(w){
    var main=el("event-main"),sub=el("event-sub"),
      card=document.querySelector(".event-card");
    main.className="card-main";
    sub.className="card-sub";
    card.className="card event-card";

    if(officialWarning){
      var level=officialWarning.level.toLowerCase();
      main.textContent=officialWarning.main;
      sub.textContent=officialWarning.sub || "Met Office official warning";
      main.className="card-main met-"+level;
      sub.className="card-sub official-warning-detail";
      if(level==="red") card.className="card event-card met-red-card";
      return;
    }

    var notice=window.HomeGlanceEvent.getNotice(w);
    if(notice){
      main.textContent=notice.main;
      sub.textContent=notice.sub;
      main.className="card-main "+notice.type;
    }else{
      var q=window.HomeGlanceQuotes.pick(new Date());
      main.textContent=q.emoji+" "+q.text;
      sub.textContent="";
      main.className="card-main quote";
    }
  }

  function renderWeather(w){
    lastWeather=w;
    document.documentElement.style.setProperty("--accent",(w.theme&&w.theme.accent)||"#bf7b00");
    el("temp").textContent=w.temp+"°";
    el("feels").textContent="Feels "+w.feels+"°";
    el("weather-desc").textContent=w.desc;
    el("high").textContent="▲ "+w.high+"°";
    el("low").textContent="▼ "+w.low+"°";
    updateSunEvent(w,new Date());
    el("status").textContent=w.status;
    el("status").className=w.rainSoon?"status rain":"status";
    el("today-detail").textContent=w.high+"° / "+w.low+"°";
    el("today-sub").textContent="UV "+w.uv;
    el("today-sub").style.color=uvColor(w.uv);
    renderNotice(w);
    renderForecast(w.forecast);
    lastUpdated=new Date();
    updateUpdatedText();
  }

  function refreshOfficialWarning(){
    return window.HomeGlanceWarnings.fetchWarning().then(function(w){
      officialWarning=w;
      if(lastWeather) renderNotice(lastWeather);
    });
  }

  function refreshWeather(){
    return window.HomeGlanceWeather.fetchWeather()
      .then(renderWeather)
      .catch(function(){
        if(!lastUpdated)el("status").textContent="Weather unavailable";
        updateUpdatedText();
      });
  }

  var lastVisibleAt=Date.now();


  function trackerClass(price){
    var c=window.HG_CONFIG;
    if(price < c.trackerCheapThreshold) return "tracker-low";
    if(price < 25) return "tracker-mid";
    if(price < 30) return "tracker-high";
    return "tracker-very-high";
  }

  function priceSpan(label,price){
    if(price===null || price===undefined) return "";
    return "<span class='tracker-label'>"+label+" </span>"+
      "<span class='"+trackerClass(price)+"'>"+price.toFixed(2)+"p</span>";
  }

  function renderTracker(){
    var holder=el("tracker-price");
    if(!holder || !window.HomeGlanceTracker) return;
    var s=window.HomeGlanceTracker.getState();

    if(s.status==="loading"){
      holder.textContent="⚡ Tracker loading…";
      return;
    }
    if(s.status==="failed"){
      holder.textContent="⚡ Tracker unavailable";
      return;
    }
    if(s.today===null){
      holder.textContent="⚡ Tracker —";
      return;
    }

    var html="⚡ "+priceSpan("Today",s.today);
    if(s.tomorrow!==null){
      var arrow=s.tomorrow<s.today?"↘":(s.tomorrow>s.today?"↗":"→");
      html+=" <span class='tracker-arrow'>"+arrow+"</span> "+
        priceSpan("Tomorrow",s.tomorrow);

      var save=(s.tomorrow < window.HG_CONFIG.trackerCheapThreshold) ||
        ((s.today-s.tomorrow) >= window.HG_CONFIG.trackerSaveDifference);
      if(save) html+=" <span class='tracker-save'>Save</span>";
    }
    holder.innerHTML=html;
  }

  function refreshTracker(force){
    return window.HomeGlanceTracker.load(!!force).then(function(){
      renderTracker();
      updateDebug();
    });
  }

  function isDebug(){
    return /(?:\?|&)debug=1(?:&|$)/.test(location.search);
  }

  function updateDebug(){
    var panel=el("debug-panel");
    if(!panel || !isDebug()) return;
    panel.hidden=false;
    panel.textContent=
      "Home Glance v1.2.3\n"+
      "Weather: Open-Meteo\n"+
      "Lunar / Solar term: "+window.HomeGlanceLunar.getStatus()+"\n"+
      "Warning: "+window.HomeGlanceWarnings.getStatus()+"\n"+
      "Warning layers: "+window.HomeGlanceWarnings.getLayers().join(", ")+"\n"+
      "Tracker: "+window.HomeGlanceTracker.getState().status+"\n"+
      "Tracker tariff: "+window.HG_CONFIG.trackerProductCode+"\n"+
      "Tracker postcode: "+window.HG_CONFIG.trackerPostcode+"\n"+
      "Tracker region: "+(window.HomeGlanceTracker.getState().region||"—")+"\n"+
      "Location: "+window.HG_CONFIG.locationName;
  }

  function refreshAll(force){
    var year=new Date().getFullYear();
    return Promise.all([
      window.HomeGlanceLunar.load(year,!!force),
      refreshOfficialWarning(),
      refreshWeather(),
      refreshTracker(!!force)
    ]).then(function(){
      updateClock();
      updateDebug();
    });
  }

  function handleResume(){
    var now=Date.now();
    var mins=(now-lastVisibleAt)/60000;
    lastVisibleAt=now;
    if(document.visibilityState==="visible"){
      updateClock();
      if(mins >= (window.HG_CONFIG.resumeRefreshAfterMinutes||2)){
        refreshAll(false);
      }else{
        updateDebug();
      }
    }
  }

  function start(){
    Promise.all([
      window.HomeGlanceQuotes.load(),
      window.HomeGlanceLunar.load(new Date().getFullYear()),
      refreshOfficialWarning(),
      refreshTracker(false)
    ]).then(function(){
      updateClock();
      return refreshWeather();
    }).then(updateDebug);

    document.addEventListener("visibilitychange",handleResume);
    window.addEventListener("pageshow",handleResume);
    window.addEventListener("focus",handleResume);
    window.addEventListener("online",function(){refreshAll(true);});

    setInterval(updateClock,60000);
    setInterval(refreshWeather,(window.HG_CONFIG.updateWeatherMinutes||15)*60000);
    setInterval(refreshOfficialWarning,15*60*1000);
    setInterval(function(){refreshTracker(false);},
      (window.HG_CONFIG.trackerRefreshMinutes||30)*60*1000);
  }

  start();
})();