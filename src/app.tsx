interface TrackStats {
  uri: string;
  title: string;
  artist: string;
  playCount: number;
  totalTime: number;
  lastPlayed: number; 
  dailyStats?: { [date: string]: { playCount: number; totalTime: number } }; 
}

class TrackStatsManager {
  private stats: Map<string, TrackStats> = new Map();
  private currentTrack: string | null = null;
  private startTime: number = 0;
  private isPlaying: boolean = false;
  private saveInterval: number = 0;

  constructor() {
    this.loadStats();
    this.setupEventListeners();
    this.startAutoSave();
    this.createStatusIndicator();
  }

  private loadStats() {
    try {
      const saved = localStorage.getItem('spicetify-track-stats');
      if (saved) {
        const data = JSON.parse(saved);
        this.stats = new Map(Object.entries(data));
        console.log(`📊 Loaded ${this.stats.size} tracks from stats`);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  private saveStats() {
    try {
      const data = Object.fromEntries(this.stats);
      localStorage.setItem('spicetify-track-stats', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }

  private startAutoSave() {
    this.saveInterval = setInterval(() => {
      this.saveStats();
    }, 30000);

    window.addEventListener('beforeunload', () => {
      this.saveStats();
    });
  }

  public clearAllStats() {
    this.stats.clear();
    localStorage.removeItem('spicetify-track-stats');
    sessionStorage.removeItem('spicetify-track-stats');
    
    document.querySelectorAll('.track-stats-playbar, .track-stats-list').forEach(el => el.remove());
    
    console.log('🗑️ All track statistics cleared');
    
    if (Spicetify?.showNotification) {
      Spicetify.showNotification('Track statistics cleared', false, 2000);
    }
  }

  private createStatusIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'track-stats-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 12px;
      height: 12px;
      background: #1db954;
      border-radius: 50%;
      z-index: 9999;
      box-shadow: 0 0 4px rgba(29, 185, 84, 0.5);
    `;
    document.body.appendChild(indicator);
  }

  private setupEventListeners() {
    Spicetify.Player.addEventListener('songchange', () => {
      this.onTrackChange();
    });

    Spicetify.Player.addEventListener('onplaypause', () => {
      this.onPlayPause();
    });

    const observer = new MutationObserver(() => {
      setTimeout(() => {
        this.addTrackListStats();
      }, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener('beforeunload', () => {
      if (this.currentTrack && this.isPlaying) {
        this.updateListeningTime();
        this.saveStats();
      }
    });
  }

  private onTrackChange() {
    if (this.currentTrack && this.isPlaying) {
      this.updateListeningTime();
    }

    const data = Spicetify.Player.data;
    if (data?.item) {
      const uri = data.item.uri;
      const title = data.item.name;
      const artist = data.item.artists?.map((a: any) => a.name).join(', ') || 'Unknown';

      if (!this.stats.has(uri)) {
        this.stats.set(uri, {
          uri,
          title,
          artist,
          playCount: 0,
          totalTime: 0,
          lastPlayed: 0,
          dailyStats: {}
        });
      }

      const stats = this.stats.get(uri)!;
      stats.playCount++;
      stats.lastPlayed = Date.now();

      const today = new Date().toISOString().split('T')[0];
      if (!stats.dailyStats) stats.dailyStats = {};
      if (!stats.dailyStats[today]) {
        stats.dailyStats[today] = { playCount: 0, totalTime: 0 };
      }
      stats.dailyStats[today].playCount++;

      this.currentTrack = uri;
      this.startTime = Date.now();
      this.isPlaying = !data.isPaused;

      this.saveStats();
      this.updateUI();
    }
  }

  private onPlayPause() {
    const data = Spicetify.Player.data;
    if (data) {
      const wasPlaying = this.isPlaying;
      this.isPlaying = !data.isPaused;

      if (wasPlaying && !this.isPlaying && this.currentTrack) {
        this.updateListeningTime();
      } else if (!wasPlaying && this.isPlaying) {
        this.startTime = Date.now();
      }
    }
  }

  private updateListeningTime() {
    if (this.currentTrack && this.startTime > 0) {
      const listenTime = Date.now() - this.startTime;
      const stats = this.stats.get(this.currentTrack);
      if (stats) {
        stats.totalTime += listenTime;
        
        const today = new Date().toISOString().split('T')[0];
        if (!stats.dailyStats) stats.dailyStats = {};
        if (!stats.dailyStats[today]) {
          stats.dailyStats[today] = { playCount: 0, totalTime: 0 };
        }
        stats.dailyStats[today].totalTime += listenTime;
      }
    }
  }

  private getTrackStats(uri: string): TrackStats | null {
    return this.stats.get(uri) || null;
  }

  private formatTime(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `<1m`;
    }
  }

  private updateUI() {
    this.updatePlaybarStats();
    this.updateWindowTitle();
    this.addTrackListStats();
  }

  private addTrackListStats() {
    const selectors = [
      '[data-testid="tracklist-row"]',
      '.main-trackList-trackListRow',
      '.main-trackList-trackListRowGrid'
    ];
    
    selectors.forEach(selector => {
      const trackRows = document.querySelectorAll(selector);
      
      trackRows.forEach((row) => {
        if (row.querySelector('.track-stats-list')) return;

        let trackTitle = '';
        let trackUri = '';

        let trackElement = row.querySelector('a[href*="/track/"]') as HTMLElement;
        if (!trackElement) {
          trackElement = row.querySelector('[data-testid="internal-track-link"]') as HTMLElement;
        }

        if (trackElement) {
          const href = trackElement.getAttribute('href');
          if (href && href.includes('/track/')) {
            trackUri = `spotify:track:${href.split('/').pop()}`;
          }
        }

        if (!trackUri) {
          const playButton = row.querySelector('.main-trackList-rowImagePlayButton') as HTMLElement;
          if (playButton) {
            const ariaLabel = playButton.getAttribute('aria-label');
            if (ariaLabel) {
              const match = ariaLabel.match(/«(.+?)»/);
              if (match) {
                trackTitle = match[1];
                
                trackUri = `spotify:track:temp_${trackTitle.toLowerCase().replace(/\s+/g, '_')}`;

                for (const [uri, stats] of this.stats) {
                  if (stats.title === trackTitle) {
                    trackUri = uri;
                    break;
                  }
                }
              }
            }
          }
        }

        if (!trackTitle) {
          const titleElement = row.querySelector('.main-trackList-rowTitle');
          if (titleElement) {
            trackTitle = titleElement.textContent?.trim() || '';
          }
        }

        if (!trackUri && trackTitle) {
          for (const [uri, stats] of this.stats) {
            if (stats.title === trackTitle) {
              trackUri = uri;
              break;
            }
          }

          if (!trackUri) {
            trackUri = `spotify:track:temp_${trackTitle.toLowerCase().replace(/\s+/g, '_')}`;
          }
        }

        if (!trackUri && !trackTitle) return;

        const stats = trackUri ? this.getTrackStats(trackUri) : null;

        const statsElement = document.createElement('div');
        statsElement.className = 'track-stats-list';
        statsElement.style.cssText = `
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
        `;

        if (stats) {
          statsElement.textContent = `${stats.playCount}x`;

          const lastPlayedDate = new Date(stats.lastPlayed).toLocaleDateString();
          statsElement.title = `Last played: ${lastPlayedDate}`;
          
          statsElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showMiniChart(stats, e.target as HTMLElement);
          });
        } else {
          statsElement.textContent = 'null';
          statsElement.style.color = '#666';
          statsElement.style.background = 'rgba(102, 102, 102, 0.1)';
          statsElement.style.border = '1px solid rgba(102, 102, 102, 0.3)';
        }

        let insertTarget = row.querySelector('.main-trackList-rowTitle');
        if (!insertTarget) {
          insertTarget = row.querySelector('[data-testid="internal-track-link"]');
        }

        if (insertTarget) {
          const parentContainer = insertTarget.parentElement;
          if (parentContainer) {
            parentContainer.style.display = 'flex';
            parentContainer.style.alignItems = 'center';
            parentContainer.style.gap = '4px';
            insertTarget.insertAdjacentElement('afterend', statsElement);
          }
        }
      });
    });
  }
  private updatePlaybarStats() {
    if (!this.currentTrack) return;

    const stats = this.getTrackStats(this.currentTrack);
    if (!stats) return;
    const oldStats = document.querySelector('.track-stats-playbar');
    if (oldStats) {
      oldStats.remove();
    }
    const statsElement = document.createElement('div');
    statsElement.className = 'track-stats-playbar';
    statsElement.style.cssText = `
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
    `;
    statsElement.textContent = `📊 ${stats.playCount}x • ${this.formatTime(stats.totalTime)}`;

    statsElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showTrackRanking(stats, statsElement);
    });

    
    const playbar = document.querySelector('[data-testid="now-playing-widget"]') as HTMLElement;
    if (playbar) {
      
      playbar.style.position = 'relative';
      playbar.appendChild(statsElement);
    }
  }

  
  private updateWindowTitle() {
    if (!this.currentTrack) return;

    const stats = this.getTrackStats(this.currentTrack);
    if (stats) {
      const originalTitle = document.title;
      if (!originalTitle.includes('Stats:')) {
        document.title = `Stats: ${stats.playCount}x ${this.formatTime(stats.totalTime)} | ${originalTitle}`;
      }
    }
  }

  
  private showMiniChart(stats: TrackStats, targetElement: HTMLElement) {
    
    const existingChart = document.querySelector('.mini-chart-modal');
    if (existingChart) {
      existingChart.remove();
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'mini-chart-modal';
    modal.style.cssText = `
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
    `;

    
    if (!document.querySelector('#mini-chart-styles')) {
      const style = document.createElement('style');
      style.id = 'mini-chart-styles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `;
      document.head.appendChild(style);
    }

    
    const header = document.createElement('div');
    header.style.cssText = `
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
    `;
    header.innerHTML = `
      <span>📊 ${stats.title} - Daily Stats</span>
      <button style="background: none; border: none; color: #999; cursor: pointer; font-size: 18px;">×</button>
    `;

    
    header.querySelector('button')!.addEventListener('click', () => modal.remove());

    
    this.makeDraggable(modal, header);

    
    const content = document.createElement('div');
    content.style.cssText = `color: #ccc; font-size: 14px; padding: 20px; overflow-y: auto; max-height: 400px;`;

    if (stats.dailyStats && Object.keys(stats.dailyStats).length > 0) {
      const sortedDays = Object.entries(stats.dailyStats)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 7); 

      sortedDays.forEach(([date, dayStats]) => {
        const dayElement = document.createElement('div');
        dayElement.style.cssText = `
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #333;
        `;
        
        const formattedDate = new Date(date).toLocaleDateString();
        const minutes = Math.round(dayStats.totalTime / (1000 * 60));
        
        dayElement.innerHTML = `
          <span>${formattedDate}</span>
          <span>${dayStats.playCount}x • ${minutes}m</span>
        `;
        content.appendChild(dayElement);
      });
    } else {
      content.textContent = 'No daily stats available';
    }

    modal.appendChild(header);
    modal.appendChild(content);
    document.body.appendChild(modal);

    
    setTimeout(() => {
      document.addEventListener('click', function closeModal(e) {
        if (!modal.contains(e.target as Node)) {
          modal.remove();
          document.removeEventListener('click', closeModal);
        }
      });
    }, 100);
  }

  
  private makeDraggable(modal: HTMLElement, handle: HTMLElement) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    handle.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).tagName === 'BUTTON') return;
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = modal.getBoundingClientRect();
      initialX = rect.left + rect.width / 2 - window.innerWidth / 2;
      initialY = rect.top + rect.height / 2 - window.innerHeight / 2;
      
      modal.style.transition = 'none';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newX = initialX + deltaX;
      const newY = initialY + deltaY;
      
      modal.style.transform = `translate(calc(-50% + ${newX}px), calc(-50% + ${newY}px))`;
    };

    const onMouseUp = () => {
      isDragging = false;
      modal.style.transition = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }

  
  private showTrackRanking(currentStats: TrackStats, targetElement: HTMLElement) {
    
    const existingRanking = document.querySelector('.track-ranking-modal');
    if (existingRanking) {
      existingRanking.remove();
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'track-ranking-modal';
    modal.style.cssText = `
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
    `;

    
    const header = document.createElement('div');
    header.style.cssText = `
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
    `;
    header.innerHTML = `
      <span>🏆 Top Tracks Ranking</span>
      <button style="background: none; border: none; color: #999; cursor: pointer; font-size: 18px;">×</button>
    `;

    
    header.querySelector('button')!.addEventListener('click', () => modal.remove());

    
    this.makeDraggable(modal, header);

    
    const sortedTracks = Array.from(this.stats.values())
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 10); 

    
    const currentTrackRank = sortedTracks.findIndex(track => track.uri === currentStats.uri) + 1;

    
    const content = document.createElement('div');
    content.style.cssText = `color: #ccc; font-size: 14px; padding: 20px; overflow-y: auto; max-height: 500px;`;

    
    if (currentTrackRank > 0) {
      const currentRankElement = document.createElement('div');
      currentRankElement.style.cssText = `
        background: rgba(30, 58, 138, 0.2);
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 15px;
        color: #1e3a8a;
        font-weight: bold;
      `;
      currentRankElement.textContent = `Current track rank: #${currentTrackRank}`;
      content.appendChild(currentRankElement);
    }

    
    sortedTracks.forEach((track, index) => {
      const trackElement = document.createElement('div');
      trackElement.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #333;
        ${track.uri === currentStats.uri ? 'background: rgba(30, 58, 138, 0.1); border-radius: 4px; padding: 8px;' : ''}
      `;
      
      const rank = index + 1;
      const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
      
      trackElement.innerHTML = `
        <div>
          <span style="margin-right: 10px;">${emoji}</span>
          <span style="font-weight: bold;">${track.title}</span>
          <span style="color: #999; margin-left: 5px;">by ${track.artist}</span>
        </div>
        <span style="color: #1e3a8a; font-weight: bold;">${track.playCount}x</span>
      `;
      content.appendChild(trackElement);
    });

    modal.appendChild(header);
    modal.appendChild(content);
    document.body.appendChild(modal);

    
    setTimeout(() => {
      document.addEventListener('click', function closeModal(e) {
        if (!modal.contains(e.target as Node)) {
          modal.remove();
          document.removeEventListener('click', closeModal);
        }
      });
    }, 100);
  }
}


let trackStatsManager: TrackStatsManager;


(function() {
  if (!Spicetify?.showNotification) {
    setTimeout(arguments.callee, 1000);
    return;
  }

  trackStatsManager = new TrackStatsManager();
  
  
  (window as any).clearTrackStats = () => {
    if (trackStatsManager) {
      trackStatsManager.clearAllStats();
    }
  };
  
})();


export default {};