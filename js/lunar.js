(function(){
  var calendarByDate = {};
  var loadedYear = null;
  var sourceStatus = "not-loaded";

  var monthNames = ["","正月","二月","三月","四月","五月","六月",
    "七月","八月","九月","十月","十一月","十二月"];
  var dayNames = ["","初一","初二","初三","初四","初五","初六","初七","初八","初九","初十",
    "十一","十二","十三","十四","十五","十六","十七","十八","十九","二十",
    "廿一","廿二","廿三","廿四","廿五","廿六","廿七","廿八","廿九","三十"];

  var termMap = {
    "Moderate Cold":"小寒","Severe Cold":"大寒","Spring Commences":"立春",
    "Spring Showers":"雨水","Insects Waken":"驚蟄","Vernal Equinox":"春分",
    "Bright & Clear":"清明","Corn Rain":"穀雨","Summer Commences":"立夏",
    "Corn Forms":"小滿","Corn on Ear":"芒種","Summer Solstice":"夏至",
    "Moderate Heat":"小暑","Great Heat":"大暑","Autumn Commences":"立秋",
    "End of Heat":"處暑","White Dew":"白露","Autumnal Equinox":"秋分",
    "Cold Dew":"寒露","Frost":"霜降","Winter Commences":"立冬",
    "Light Snow":"小雪","Heavy Snow":"大雪","Winter Solstice":"冬至"
  };

  // Official HKO solar-term dates bundled for local file:// use and CORS fallback.
  // Source: HKO Gregorian-Lunar Calendar Conversion Tables.
  var officialSolarTerms = {
    "2026-01-05":"小寒","2026-01-20":"大寒","2026-02-04":"立春","2026-02-18":"雨水",
    "2026-03-05":"驚蟄","2026-03-20":"春分","2026-04-05":"清明","2026-04-20":"穀雨",
    "2026-05-05":"立夏","2026-05-21":"小滿","2026-06-05":"芒種","2026-06-21":"夏至",
    "2026-07-07":"小暑","2026-07-23":"大暑","2026-08-07":"立秋","2026-08-23":"處暑",
    "2026-09-07":"白露","2026-09-23":"秋分","2026-10-08":"寒露","2026-10-23":"霜降",
    "2026-11-07":"立冬","2026-11-22":"小雪","2026-12-07":"大雪","2026-12-22":"冬至",

    "2027-01-05":"小寒","2027-01-20":"大寒","2027-02-04":"立春","2027-02-19":"雨水",
    "2027-03-06":"驚蟄","2027-03-21":"春分","2027-04-05":"清明","2027-04-20":"穀雨",
    "2027-05-06":"立夏","2027-05-21":"小滿","2027-06-06":"芒種","2027-06-21":"夏至",
    "2027-07-07":"小暑","2027-07-23":"大暑","2027-08-08":"立秋","2027-08-23":"處暑",
    "2027-09-08":"白露","2027-09-23":"秋分","2027-10-08":"寒露","2027-10-23":"霜降",
    "2027-11-07":"立冬","2027-11-22":"小雪","2027-12-07":"大雪","2027-12-22":"冬至"
  };

  function pad(n){ return n < 10 ? "0" + n : "" + n; }
  function key(date){
    return date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate());
  }

  function parseIntl(date){
    try{
      var parts = new Intl.DateTimeFormat("en-u-ca-chinese",{
        month:"numeric",day:"numeric"
      }).formatToParts(date);
      var m=null,d=null;
      for(var i=0;i<parts.length;i++){
        if(parts[i].type==="month") m=parseInt(parts[i].value,10);
        if(parts[i].type==="day") d=parseInt(parts[i].value,10);
      }
      if(m && d) return monthNames[m]+dayNames[d];
    }catch(e){}
    return "農曆";
  }

  function cleanText(text){
    return text
      .replace(/\r/g,"\n")
      .replace(/\u00a0/g," ")
      .replace(/[ \t]+/g," ")
      .replace(/\n{2,}/g,"\n");
  }

  function parseHkoText(text){
    text = cleanText(text);
    var result = {};
    var currentMonth = null;
    var isLeapMonth = false;

    // Match each dated row, keeping all text until the next dated row.
    var re = /(\d{4})\/(\d{1,2})\/(\d{1,2})\s+([\s\S]*?)(?=\d{4}\/\d{1,2}\/\d{1,2}\s+|$)/g;
    var match;

    while((match = re.exec(text)) !== null){
      var y=+match[1], m=+match[2], d=+match[3];
      var body = match[4].replace(/\s+/g," ").trim();
      var lunarDay = null;

      // HKO may describe the first day as "1st Lunar Month"
      // and leap months with "Intercalary" / "Leap".
      var monthMatch = body.match(/(?:(Intercalary|Leap)\s+)?(\d{1,2})(?:st|nd|rd|th)\s+Lunar Month/i);
      if(monthMatch){
        isLeapMonth = !!monthMatch[1];
        currentMonth = parseInt(monthMatch[2],10);
        lunarDay = 1;
      }else{
        var dayMatch = body.match(/^(\d{1,2})\b/);
        if(dayMatch) lunarDay = parseInt(dayMatch[1],10);
      }

      var solarTerm = "";
      for(var english in termMap){
        if(Object.prototype.hasOwnProperty.call(termMap,english) && body.indexOf(english) !== -1){
          solarTerm = termMap[english];
          break;
        }
      }

      var lunar = "";
      if(currentMonth && lunarDay){
        lunar = (isLeapMonth ? "閏" : "") + monthNames[currentMonth] + dayNames[lunarDay];
      }

      result[y+"-"+pad(m)+"-"+pad(d)] = {
        lunar:lunar,
        solarTerm:solarTerm
      };
    }
    return result;
  }

  function load(year,force){
    if(!force && loadedYear===year && Object.keys(calendarByDate).length){
      return Promise.resolve();
    }

    var cacheKey="homeglance-hko-calendar-"+year+"-v3";
    if(!force){
      try{
        var cached=localStorage.getItem(cacheKey);
        if(cached){
          calendarByDate=JSON.parse(cached);
          loadedYear=year;
          sourceStatus="hko-cache";
          return Promise.resolve();
        }
      }catch(e){}
    }

    var url="https://www.weather.gov.hk/en/gts/time/calendar/text/files/T"+year+"e.txt";
    return fetch(url,{cache:"no-cache"})
      .then(function(r){
        if(!r.ok) throw new Error("HKO HTTP "+r.status);
        return r.text();
      })
      .then(function(text){
        var parsed=parseHkoText(text);
        if(Object.keys(parsed).length < 360) throw new Error("HKO parse incomplete");
        calendarByDate=parsed;
        loadedYear=year;
        sourceStatus="hko-live";
        try{ localStorage.setItem(cacheKey,JSON.stringify(parsed)); }catch(e){}
      })
      .catch(function(){
        calendarByDate={};
        loadedYear=year;
        sourceStatus="hko-terms-bundled+intl-lunar";
      });
  }

  function getText(date){
    var item=calendarByDate[key(date)];
    return item && item.lunar ? item.lunar : parseIntl(date);
  }

  function getSolarTerm(date){
    var dateKey=key(date);
    var item=calendarByDate[dateKey];
    if(item && item.solarTerm) return item.solarTerm;
    return officialSolarTerms[dateKey] || "";
  }

  function getStatus(){ return sourceStatus; }

  window.HomeGlanceLunar={
    load:load,
    getText:getText,
    getSolarTerm:getSolarTerm,
    getStatus:getStatus,
    source:"Hong Kong Observatory"
  };
})();