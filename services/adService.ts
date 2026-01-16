
export class AdSDK {
  private static isShowing = false;

  static async showInterstitial(): Promise<void> {
    if (this.isShowing) return Promise.resolve();
    this.isShowing = true;

    return new Promise((resolve) => {
      const adOverlay = document.createElement('div');
      adOverlay.id = 'interstitial-ad-overlay';
      adOverlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-500 opacity-0';
      
      adOverlay.innerHTML = `
        <div class="relative w-full h-full max-w-lg md:max-h-[80vh] md:rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-black overflow-hidden shadow-2xl flex flex-col">
          <!-- Close Button Container -->
          <div id="ad-close-container" class="absolute top-6 right-6 z-[110]">
             <div id="ad-timer" class="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center font-bold text-white bg-black/40 backdrop-blur-md">3</div>
          </div>

          <!-- Ad Content -->
          <div class="flex-1 flex flex-col p-8 items-center justify-center text-center">
            <div class="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-3xl mb-6 shadow-xl flex items-center justify-center text-5xl">📱</div>
            <h2 class="text-3xl font-bold text-white mb-2">Gemini Pro Max</h2>
            <p class="text-slate-400 mb-8 px-4">Experience the next generation of mobile gaming with AI-driven performance.</p>
            
            <div class="w-full aspect-video bg-slate-800 rounded-2xl mb-8 flex items-center justify-center text-slate-600 border border-white/5">
              <span class="animate-pulse">Loading Video Preview...</span>
            </div>

            <button class="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-colors">
              INSTALL NOW
            </button>
          </div>

          <!-- Footer Badge -->
          <div class="p-4 bg-black/40 text-[10px] text-slate-500 text-center tracking-widest uppercase font-bold border-t border-white/5">
            Advertisement Provided by SlasherAds SDK
          </div>
        </div>
      `;

      document.body.appendChild(adOverlay);
      
      // Fade in
      setTimeout(() => adOverlay.style.opacity = '1', 10);

      let timeLeft = 3;
      const timerElement = adOverlay.querySelector('#ad-timer');
      const closeContainer = adOverlay.querySelector('#ad-close-container');

      const countdown = setInterval(() => {
        timeLeft--;
        if (timerElement) timerElement.textContent = timeLeft.toString();
        
        if (timeLeft <= 0) {
          clearInterval(countdown);
          if (closeContainer) {
            closeContainer.innerHTML = `
              <button id="close-ad-btn" class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all group">
                <svg class="w-6 h-6 text-white group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            `;
            document.getElementById('close-ad-btn')?.addEventListener('click', () => {
              adOverlay.style.opacity = '0';
              setTimeout(() => {
                document.body.removeChild(adOverlay);
                this.isShowing = false;
                resolve();
              }, 500);
            });
          }
        }
      }, 1000);
    });
  }
}
