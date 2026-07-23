(function(){
  var fallback=[
    {emoji:"😊",text:"今日都要對自己好啲。"},
    {emoji:"😌",text:"可以 hea 的話，點解要郁。"},
    {emoji:"☕",text:"飲啖咖啡先再諗。"}
  ];
  var quotes=fallback;
  function seed(date){ return date.getFullYear()*372 + (date.getMonth()+1)*31 + date.getDate(); }
  function pick(date){ return quotes[Math.abs(seed(date))%quotes.length]; }
  function load(){
    return fetch("data/quotes.json",{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error("quotes");return r.json();}).then(function(data){if(Array.isArray(data)&&data.length)quotes=data;}).catch(function(){});
  }
  window.HomeGlanceQuotes={load:load,pick:pick};
})();