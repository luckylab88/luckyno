(function(){
  window.HomeGlanceEvent={
    getNotice:function(w){
      if(!w) return null;
      if(w.code>=95) return {main:"Thunderstorm",sub:"Stay indoors",type:"storm"};
      if(w.code>=71&&w.code<=75) return {main:"Snow Warning",sub:"Slippery roads",type:"snow"};
      if(w.low<=1) return {main:"Frost Warning",sub:"Slippery roads",type:"frost"};
      if(w.precipitation>=15) return {main:"Heavy Rain",sub:"Drive carefully",type:"rain"};
      if(w.windMax>=50) return {main:"Strong Wind",sub:"Drive carefully",type:"wind"};
      if(w.code===45||w.code===48) return {main:"Dense Fog",sub:"Drive carefully",type:"fog"};
      if(w.high>=28&&w.uv>=6) return {main:"Heat Alert",sub:"Stay hydrated",type:"hot"};
      if(w.uv>=8) return {main:"Very High UV",sub:"Limit exposure",type:"uv"};
      return null;
    }
  };
})();