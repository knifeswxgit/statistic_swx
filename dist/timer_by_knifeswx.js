(async()=>{for(;!Spicetify.React||!Spicetify.ReactDOM;)await new Promise(t=>setTimeout(t,10));var t,e,a;e=class{constructor(){this.stats=new Map,this.currentTrack=null,this.startTime=0,this.isPlaying=!1,this.saveInterval=0,this.loadStats(),this.setupEventListeners(),this.startAutoSave(),this.createStatusIndicator()}loadStats(){try{var t,e=localStorage.getItem("spicetify-track-stats");e&&(t=JSON.parse(e),this.stats=new Map(Object.entries(t)),console.log(`📊 Loaded ${this.stats.size} tracks from stats`))}catch(t){console.error("Error loading stats:",t)}}saveStats(){try{var t=Object.fromEntries(this.stats);localStorage.setItem("spicetify-track-stats",JSON.stringify(t))}catch(t){console.error("Error saving stats:",t)}}startAutoSave(){this.saveInterval=setInterval(()=>{this.saveStats()},3e4),window.addEventListener("beforeunload",()=>{this.saveStats()})}clearAllStats(){this.stats.clear(),localStorage.removeItem("spicetify-track-stats"),sessionStorage.removeItem("spicetify-track-stats"),document.querySelectorAll(".track-stats-playbar, .track-stats-list").forEach(t=>t.remove()),console.log("🗑️ All track statistics cleared"),null!=Spicetify&&Spicetify.showNotification&&Spicetify.showNotification("Track statistics cleared",!1,2e3)}createStatusIndicator(){var t=document.createElement("div");t.id="track-stats-indicator",t.style.cssText=`
      position: fixed;
      top: 10px;
      right: 10px;
      width: 12px;
      height: 12px;
      background: #1db954;
      border-radius: 50%;
      z-index: 9999;
      box-shadow: 0 0 4px rgba(29, 185, 84, 0.5);
    `,document.body.appendChild(t)}setupEventListeners(){Spicetify.Player.addEventListener("songchange",()=>{this.onTrackChange()}),Spicetify.Player.addEventListener("onplaypause",()=>{this.onPlayPause()}),new MutationObserver(()=>{setTimeout(()=>{this.addTrackListStats()},500)}).observe(document.body,{childList:!0,subtree:!0}),window.addEventListener("beforeunload",()=>{this.currentTrack&&this.isPlaying&&(this.updateListeningTime(),this.saveStats())})}onTrackChange(){this.currentTrack&&this.isPlaying&&this.updateListeningTime();var t,e,a,i=Spicetify.Player.data;null!=i&&i.item&&(t=i.item.uri,e=i.item.name,a=(null==(a=i.item.artists)?void 0:a.map(t=>t.name).join(", "))||"Unknown",this.stats.has(t)||this.stats.set(t,{uri:t,title:e,artist:a,playCount:0,totalTime:0,lastPlayed:0,dailyStats:{}}),(e=this.stats.get(t)).playCount++,e.lastPlayed=Date.now(),a=(new Date).toISOString().split("T")[0],e.dailyStats||(e.dailyStats={}),e.dailyStats[a]||(e.dailyStats[a]={playCount:0,totalTime:0}),e.dailyStats[a].playCount++,this.currentTrack=t,this.startTime=Date.now(),this.isPlaying=!i.isPaused,this.saveStats(),this.updateUI())}onPlayPause(){var t,e=Spicetify.Player.data;e&&(t=this.isPlaying,this.isPlaying=!e.isPaused,t&&!this.isPlaying&&this.currentTrack?this.updateListeningTime():!t&&this.isPlaying&&(this.startTime=Date.now()))}updateListeningTime(){var t,e,a;this.currentTrack&&0<this.startTime&&(t=Date.now()-this.startTime,e=this.stats.get(this.currentTrack))&&(e.totalTime+=t,a=(new Date).toISOString().split("T")[0],e.dailyStats||(e.dailyStats={}),e.dailyStats[a]||(e.dailyStats[a]={playCount:0,totalTime:0}),e.dailyStats[a].totalTime+=t)}getTrackStats(t){return this.stats.get(t)||null}formatTime(t){var e=Math.floor(t/36e5),t=Math.floor(t%36e5/6e4);return 0<e?e+`h ${t}m`:0<t?t+"m":"<1m"}updateUI(){this.updatePlaybarStats(),this.updateWindowTitle(),this.addTrackListStats()}addTrackListStats(){['[data-testid="tracklist-row"]',".main-trackList-trackListRow",".main-trackList-trackListRowGrid"].forEach(t=>{document.querySelectorAll(t).forEach(i=>{if(!i.querySelector(".track-stats-list")){let t="",a="",e=i.querySelector('a[href*="/track/"]');if(e=e||i.querySelector('[data-testid="internal-track-link"]'),!(a=e&&(s=e.getAttribute("href"))&&s.includes("/track/")?"spotify:track:"+s.split("/").pop():a)){var s=i.querySelector(".main-trackList-rowImagePlayButton");if(s){var s=s.getAttribute("aria-label");if(s){var s=s.match(/«(.+?)»/);if(s){t=s[1],a="spotify:track:temp_"+t.toLowerCase().replace(/\s+/g,"_");for(var[r,n]of this.stats)if(n.title===t){a=r;break}}}}}if(t||(s=i.querySelector(".main-trackList-rowTitle"))&&(t=(null==(s=s.textContent)?void 0:s.trim())||""),!a&&t){for(var[o,l]of this.stats)if(l.title===t){a=o;break}a=a||"spotify:track:temp_"+t.toLowerCase().replace(/\s+/g,"_")}if(a||t){let e=a?this.getTrackStats(a):null;var c,s=document.createElement("div");s.className="track-stats-list",s.style.cssText=`
          font-size: 10px;
          color: #1e3a8a;
          font-weight: 600;
          margin-left: 4px;
          margin-right: 4px;
          padding: 2px 6px;
          background: rgba(30, 58, 138, 0.15);
          border: 1px solid rgba(30, 58, 138, 0.3);
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          vertical-align: middle;
        `,e?(s.textContent=e.playCount+"x",c=new Date(e.lastPlayed).toLocaleDateString(),s.title="Last played: "+c,s.addEventListener("click",t=>{t.stopPropagation(),this.showMiniChart(e,t.target)})):(s.textContent="null",s.style.color="#666",s.style.background="rgba(102, 102, 102, 0.1)",s.style.border="1px solid rgba(102, 102, 102, 0.3)");let t=i.querySelector(".main-trackList-rowTitle");(t=t||i.querySelector('[data-testid="internal-track-link"]'))&&(c=t.parentElement)&&(c.style.display="flex",c.style.alignItems="center",c.style.gap="4px",t.insertAdjacentElement("afterend",s))}}})})}updatePlaybarStats(){if(this.currentTrack){let a=this.getTrackStats(this.currentTrack);if(a){var t=document.querySelector(".track-stats-playbar");t&&t.remove();let e=document.createElement("div");e.className="track-stats-playbar",e.style.cssText=`
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 13px;
      color: #1e3a8a;
      padding: 6px 12px;
      font-weight: 600;
      background: rgba(30, 58, 138, 0.15);
      border: 1px solid rgba(30, 58, 138, 0.3);
      border-radius: 14px;
      white-space: nowrap;
      z-index: 10;
      cursor: pointer;
    `,e.textContent=`📊 ${a.playCount}x • `+this.formatTime(a.totalTime),e.addEventListener("click",t=>{t.stopPropagation(),this.showTrackRanking(a,e)});t=document.querySelector('[data-testid="now-playing-widget"]');t&&(t.style.position="relative",t.appendChild(e))}}}updateWindowTitle(){var t,e;this.currentTrack&&(t=this.getTrackStats(this.currentTrack))&&!(e=document.title).includes("Stats:")&&(document.title=`Stats: ${t.playCount}x ${this.formatTime(t.totalTime)} | `+e)}showMiniChart(t,e){var i=document.querySelector(".mini-chart-modal");if(i)i.remove();else{let a=document.createElement("div");a.className="mini-chart-modal",a.style.cssText=`
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 0;
      z-index: 10000;
      min-width: 400px;
      max-height: 500px;
      overflow: hidden;
      animation: fadeIn 0.3s ease-out;
      user-select: none;
    `,document.querySelector("#mini-chart-styles")||((i=document.createElement("style")).id="mini-chart-styles",i.textContent=`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `,document.head.appendChild(i));i=document.createElement("div");i.style.cssText=`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      color: white;
      font-weight: bold;
      cursor: move;
      background: #2a2a2a;
      border-radius: 12px 12px 0 0;
      border-bottom: 1px solid #333;
    `,i.innerHTML=`
      <span>📊 ${t.title} - Daily Stats</span>
      <button style="background: none; border: none; color: #999; cursor: pointer; font-size: 18px;">×</button>
    `,i.querySelector("button").addEventListener("click",()=>a.remove()),this.makeDraggable(a,i);let s=document.createElement("div");s.style.cssText="color: #ccc; font-size: 14px; padding: 20px; overflow-y: auto; max-height: 400px;",t.dailyStats&&0<Object.keys(t.dailyStats).length?Object.entries(t.dailyStats).sort(([t],[e])=>e.localeCompare(t)).slice(0,7).forEach(([t,e])=>{var a=document.createElement("div"),t=(a.style.cssText=`
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #333;
        `,new Date(t).toLocaleDateString()),i=Math.round(e.totalTime/6e4);a.innerHTML=`
          <span>${t}</span>
          <span>${e.playCount}x • ${i}m</span>
        `,s.appendChild(a)}):s.textContent="No daily stats available",a.appendChild(i),a.appendChild(s),document.body.appendChild(a),setTimeout(()=>{document.addEventListener("click",function t(e){a.contains(e.target)||(a.remove(),document.removeEventListener("click",t))})},100)}}makeDraggable(a,t){let i=!1,s=0,r=0,n=0,o=0,e=(t.addEventListener("mousedown",t=>{"BUTTON"!==t.target.tagName&&(i=!0,s=t.clientX,r=t.clientY,t=a.getBoundingClientRect(),n=t.left+t.width/2-window.innerWidth/2,o=t.top+t.height/2-window.innerHeight/2,a.style.transition="none",document.addEventListener("mousemove",e),document.addEventListener("mouseup",l))}),t=>{var e;i&&(e=t.clientX-s,t=t.clientY-r,e=n+e,t=o+t,a.style.transform=`translate(calc(-50% + ${e}px), calc(-50% + ${t}px))`)}),l=()=>{i=!1,a.style.transition="",document.removeEventListener("mousemove",e),document.removeEventListener("mouseup",l)}}showTrackRanking(s,t){var e=document.querySelector(".track-ranking-modal");if(e)e.remove();else{let a=document.createElement("div");a.className="track-ranking-modal",a.style.cssText=`
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 0;
      z-index: 10000;
      min-width: 500px;
      max-height: 600px;
      overflow: hidden;
      animation: fadeIn 0.3s ease-out;
      user-select: none;
    `;var r,e=document.createElement("div"),n=(e.style.cssText=`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      color: white;
      font-weight: bold;
      cursor: move;
      background: #2a2a2a;
      border-radius: 12px 12px 0 0;
      border-bottom: 1px solid #333;
    `,e.innerHTML=`
      <span>🏆 Top Tracks Ranking</span>
      <button style="background: none; border: none; color: #999; cursor: pointer; font-size: 18px;">×</button>
    `,e.querySelector("button").addEventListener("click",()=>a.remove()),this.makeDraggable(a,e),Array.from(this.stats.values()).sort((t,e)=>e.playCount-t.playCount).slice(0,10)),o=n.findIndex(t=>t.uri===s.uri)+1;let i=document.createElement("div");i.style.cssText="color: #ccc; font-size: 14px; padding: 20px; overflow-y: auto; max-height: 500px;",0<o&&((r=document.createElement("div")).style.cssText=`
        background: rgba(30, 58, 138, 0.2);
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 15px;
        color: #1e3a8a;
        font-weight: bold;
      `,r.textContent="Current track rank: #"+o,i.appendChild(r)),n.forEach((t,e)=>{var a=document.createElement("div"),e=(a.style.cssText=`
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #333;
        ${t.uri===s.uri?"background: rgba(30, 58, 138, 0.1); border-radius: 4px; padding: 8px;":""}
      `,e+1);a.innerHTML=`
        <div>
          <span style="margin-right: 10px;">${1===e?"🥇":2===e?"🥈":3===e?"🥉":e+"."}</span>
          <span style="font-weight: bold;">${t.title}</span>
          <span style="color: #999; margin-left: 5px;">by ${t.artist}</span>
        </div>
        <span style="color: #1e3a8a; font-weight: bold;">${t.playCount}x</span>
      `,i.appendChild(a)}),a.appendChild(e),a.appendChild(i),document.body.appendChild(a),setTimeout(()=>{document.addEventListener("click",function t(e){a.contains(e.target)||(a.remove(),document.removeEventListener("click",t))})},100)}}},function(){null!=Spicetify&&Spicetify.showNotification?(t=new e,window.clearTrackStats=()=>{t&&t.clearAllStats()}):setTimeout(arguments.callee,1e3)}(),a={},(async()=>{await a()})()})();