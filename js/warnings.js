(function(){
  var cachedWarning=null;
  var lastFetch=0;
  var status="not-loaded";
  var discoveredLayers=[];

  function levelRank(level){
    level=String(level||"").toUpperCase();
    if(level.indexOf("RED")!==-1) return 3;
    if(level.indexOf("AMBER")!==-1) return 2;
    if(level.indexOf("YELLOW")!==-1) return 1;
    return 0;
  }

  function firstValue(obj,names){
    for(var i=0;i<names.length;i++){
      if(obj[names[i]]!==undefined && obj[names[i]]!==null && obj[names[i]]!==""){
        return obj[names[i]];
      }
    }
    return "";
  }

  function titleCase(s){
    return String(s||"").toLowerCase().replace(/\b\w/g,function(c){return c.toUpperCase();});
  }

  function parseTime(value){
    if(!value) return null;
    if(typeof value==="number") return value;
    var t=new Date(value).getTime();
    return isNaN(t)?null:t;
  }

  function normaliseFeature(feature){
    var p=feature.properties||feature.attributes||{};
    var level=String(firstValue(p,[
      "warningLevel","WarningLevel","WARNINGLEVEL","warning_level",
      "warningColour","WarningColour","severity","Severity","level","Level"
    ])||"").toUpperCase();

    var weather=firstValue(p,[
      "weatherType","WeatherType","WEATHERTYPE","weather_type",
      "event","Event","type","Type"
    ]);
    if(Array.isArray(weather)) weather=weather.join(" / ");
    weather=titleCase(String(weather||"Weather").replace(/_/g," "));

    var headline=String(firstValue(p,[
      "warningHeadline","WarningHeadline","WARNINGHEADLINE",
      "headline","Headline","description","Description"
    ])||"");

    var from=parseTime(firstValue(p,[
      "validFromDate","ValidFromDate","valid_from","start","Start","effective","Effective"
    ]));
    var to=parseTime(firstValue(p,[
      "validToDate","ValidToDate","valid_to","end","End","expires","Expires"
    ]));
    var now=Date.now();

    if(from && from>now) return null;
    if(to && to<now) return null;
    if(!levelRank(level)) return null;

    return {
      level:level,
      rank:levelRank(level),
      main:titleCase(level)+" "+weather+" Warning",
      sub:headline,
      source:"Met Office"
    };
  }

  function queryLayer(serviceUrl,layerId,lon,lat){
    var q=serviceUrl.replace(/\/+$/,"")+"/"+layerId+"/query";
    var params=[
      "where=1%3D1",
      "geometry="+encodeURIComponent(lon+","+lat),
      "geometryType=esriGeometryPoint",
      "inSR=4326",
      "spatialRel=esriSpatialRelIntersects",
      "outFields=*",
      "returnGeometry=false",
      "f=json"
    ].join("&");

    return fetch(q+"?"+params,{cache:"no-cache"})
      .then(function(r){
        if(!r.ok) throw new Error("Layer "+layerId+" HTTP "+r.status);
        return r.json();
      })
      .then(function(data){
        return (data.features||[]).map(normaliseFeature).filter(Boolean);
      });
  }

  function discoverLayers(serviceUrl){
    return fetch(serviceUrl.replace(/\/+$/,"")+"?f=json",{cache:"no-cache"})
      .then(function(r){
        if(!r.ok) throw new Error("Service HTTP "+r.status);
        return r.json();
      })
      .then(function(meta){
        var ids=[];
        (meta.layers||[]).forEach(function(layer){ ids.push(layer.id); });
        (meta.tables||[]).forEach(function(table){ ids.push(table.id); });
        if(!ids.length){
          for(var i=0;i<5;i++) ids.push(i);
        }
        discoveredLayers=ids.slice();
        return ids;
      });
  }

  function fetchWarning(force){
    if(!window.HG_CONFIG.useMetOfficeWarnings) return Promise.resolve(null);
    if(!force && lastFetch && Date.now()-lastFetch<15*60*1000){
      return Promise.resolve(cachedWarning);
    }

    status="loading";
    var itemId=window.HG_CONFIG.metOfficeArcgisItemId;
    var metaUrl="https://www.arcgis.com/sharing/rest/content/items/"+itemId+"?f=json";

    return fetch(metaUrl,{cache:"no-cache"})
      .then(function(r){
        if(!r.ok) throw new Error("ArcGIS item HTTP "+r.status);
        return r.json();
      })
      .then(function(meta){
        if(!meta.url) throw new Error("ArcGIS service URL missing");
        return discoverLayers(meta.url).then(function(ids){
          return Promise.all(ids.map(function(id){
            return queryLayer(
              meta.url,id,
              window.HG_CONFIG.longitude,
              window.HG_CONFIG.latitude
            ).catch(function(){return[];});
          }));
        });
      })
      .then(function(groups){
        var warnings=[];
        groups.forEach(function(g){warnings=warnings.concat(g);});
        warnings.sort(function(a,b){return b.rank-a.rank;});
        cachedWarning=warnings[0]||null;
        lastFetch=Date.now();
        status=cachedWarning?"official-warning":"official-clear";
        return cachedWarning;
      })
      .catch(function(){
        cachedWarning=null;
        lastFetch=Date.now();
        status="fallback";
        return null;
      });
  }

  function getStatus(){return status;}
  function getLayers(){return discoveredLayers.slice();}

  window.HomeGlanceWarnings={
    fetchWarning:fetchWarning,
    getStatus:getStatus,
    getLayers:getLayers,
    source:"Met Office NSWWS"
  };
})();