// Global GSAP timeline/tweens
let bounceTween;

function openInvitation() {
    const btn = document.querySelector('.open-btn');
    const container = document.querySelector('.card-container');

    // Kill the infinite GSAP bounce cleanly before we animate
    if (bounceTween) bounceTween.kill();
    gsap.set(btn, { y: 0 }); // Reset position safely
    
    // Start background music inside this user gesture (the Open click).
    // The YT API player was cued on load; this is what browsers allow to
    // unmute + play. If the player is still loading, startBackgroundMusic()
    // waits for onReady and plays as soon as it can.
    startBackgroundMusic();


    // GSAP Timeline for opening exactly replacing the CSS behavior
    const tl = gsap.timeline({
        onStart: () => {
            document.body.style.overflow = 'visible';
            // Need to remove display:none on invitation-section early so GSAP can calculate it
            const invSection = document.querySelector('.invitation-section');
            invSection.style.display = 'block';
            invSection.style.opacity = '1'; // Make it visible IMMEDIATELY so entrance animations can be seen!
        },
        onComplete: () => {
            container.classList.add('opened');

            // Hide scroll hint permanently after 6 seconds
            setTimeout(() => {
                const scrollHint = document.querySelector('.scroll-hint');
                if (scrollHint) {
                    scrollHint.classList.add('hidden');
                    scrollHint.classList.add('gone');
                }
            }, 4000);

            setTimeout(() => { ScrollTrigger.refresh(); }, 100);

            // Start continuous GSAP inner flower sway natively!
            gsap.to('.inner-flower', {
                rotation: 3,
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                stagger: 0.2
            });

            // Initialize Scatter Effect strictly AFTER entrance animation concludes
            const heroFlowers = [
                { selector: '.flower-1', x: -150, y: -150, rotation: -15 }, // Top flora
                { selector: '.flower-2', x: -200, y: -50, rotation: -25 },  // Mid flora
                { selector: '.flower-3', x: -250, y: 0, rotation: 15 },     // Lower flora
                { selector: '.flower-4', x: -200, y: 100, rotation: -20 },  // Bottom flora
                { selector: '.flower-5', x:    0, y: 250, rotation: 15 } // Corner flora: aggressively peels straight down the Y axis
            ];
        
            heroFlowers.forEach(flower => {
                gsap.to(flower.selector, {
                    scrollTrigger: {
                        trigger: '.hero-section',
                        start: "top top",
                        end: "bottom center",
                        scrub: true
                    },
                    x: flower.x,
                    y: flower.y,
                    rotation: flower.rotation,
                    opacity: 0,
                    ease: "none"
                });
            });
            
            // Auto-scroll logic
            setTimeout(() => {
                let isAutoScrolling = true;
                let currentY = window.scrollY;

                const stopScroll = () => { isAutoScrolling = false; };
                window.addEventListener('touchstart', stopScroll, { once: true, passive: true });
                window.addEventListener('wheel', stopScroll, { once: true, passive: true });
                window.addEventListener('mousedown', stopScroll, { once: true, passive: true });

                let lastTime = null;
                function scrollStep(timestamp) {
                    if (!isAutoScrolling) return;
                    if (!lastTime) lastTime = timestamp;
                    const deltaTime = timestamp - lastTime;
                    lastTime = timestamp;

                    currentY += (65 * deltaTime) / 1000; 
                    window.scrollTo(0, currentY);

                    if (currentY < document.body.scrollHeight - window.innerHeight) {
                        requestAnimationFrame(scrollStep);
                    }
                }
                requestAnimationFrame(scrollStep);
            }, 500);
        }
    });

    // 1. Button press effect (snappy press and pop)
    tl.to(btn, { scale: 0.9, duration: 0.1, ease: "power1.out" })
        .to(btn, { scale: 1, duration: 0.2, ease: "back.out(2)" })
      // 2. Cover Section fades out fully first (sequential handoff)
        .to('.cover-section', { autoAlpha: 0, duration: 0.6, ease: "power2.inOut" }, "<0.1")
      // 3. Hero section fades in as one unit AFTER the cover is gone
        .fromTo('.hero-section',
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.8, ease: "power2.out" }
        )
      // 4. Inner Flowers smoothly slide in from the outer edge to their origin
        .fromTo('.inner-flower', 
            { 
                x: (i, target) => target.classList.contains('flower-5') ? 0 : -150, 
                y: (i, target) => target.classList.contains('flower-5') ? 150 : 0, 
                opacity: 0 
            },
            { x: 0, y: 0, opacity: 1, duration: 1.8, ease: "power2.out" }, 
            "-=0.5"
        )
      // 5. Invitation Content gently lifts into place
        .fromTo('.invitation-content', 
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: "power2.out" },
            "-=0.9"
        );
}

// Global Timeline for Modals
let popupTl = null;

function initPopupTimeline() {
    if (popupTl) return; // Only initialize once
    
    // Explicitly zero out absolute pixel translations and safely animate using pure Percentages
    gsap.set('.popup-overlay', { autoAlpha: 0 });
    gsap.set('.popup-container', { x: 0, y: 0, xPercent: -50, yPercent: 100 });
    
    // Create explicitly paused timeline
    popupTl = gsap.timeline({ paused: true })
        .to('.popup-overlay', { autoAlpha: 1, duration: 0.3, pointerEvents: 'all' }, 0)
        .to('.popup-container', { yPercent: 0, duration: 0.4, ease: "power3.out" }, 0);
}

function openPopup(event, popupId) {
    if (event) event.preventDefault();
    if (!popupTl) initPopupTimeline();
    
    // Hide all popup contents directly
    document.querySelectorAll('.popup-content').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    
    // Show requested content block
    const target = document.getElementById('popup-' + popupId);
    if(target) {
        target.style.display = 'flex';
        target.classList.add('active');
        
        // Play GSAP slide-up animation
        popupTl.play();
    }
}

function closePopup(event) {
    if (event) event.preventDefault();
    if (popupTl) {
        // Reverse GSAP animation perfectly back to hidden state
        popupTl.reverse();
        // Since timelines are extremely fast, we don't strictly need to reset display:none on children,
        // but it's good practice to ensure cleanliness
    }
}

// iOS Safari / Multi-Platform native Apple Calendar ICS file generator
function downloadICS(event) {
    if (event) event.preventDefault();
    const icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20261220T033000Z
DTEND:20261220T090000Z
SUMMARY:Majlis Perkahwinan Ariff & Ruby
DESCRIPTION:Dengan segala hormatnya kami menjemput ke majlis perkahwinan putera kami.
LOCATION:DIMA GARDEN, Karangan, Kedah
END:VEVENT
END:VCALENDAR`;

    // Detect iOS specifically because it notoriously blocks Data URI Blob downloads but natively parses explicit Base64 text/calendar
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
        window.location.href = "data:text/calendar;base64," + btoa(icsContent);
    } else {
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'majlis_adam_faridah.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
}

// Copy to Clipboard Utility
function copyText(button, text) {
    // Elegant fallback for non-secure contexts (http) or older iOS
    if (!navigator.clipboard || !window.isSecureContext) {
        fallbackCopy(text, button);
        return;
    }
    navigator.clipboard.writeText(text).then(() => showCopySuccess(button)).catch(() => fallbackCopy(text, button));
}

function fallbackCopy(text, button) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showCopySuccess(button);
    } catch (err) {
        console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
}

function showCopySuccess(button) {
    const originalClass = button.className;
    const originalColor = button.style.color;
    
    button.className = 'fa-solid fa-check copy-icon';
    button.style.color = '#25D366'; // Green success visual
    
    setTimeout(() => {
        button.className = originalClass;
        button.style.color = originalColor;
    }, 2000);
}

// Countdown Logic
function updateCountdown() {
    const targetDate = new Date("Dec 20, 2026 00:00:00").getTime();
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        const daysEl = document.getElementById("days");
        if(daysEl) {
            daysEl.innerText = days.toString().padStart(2, '0');
            document.getElementById("hours").innerText = hours.toString().padStart(2, '0');
            document.getElementById("minutes").innerText = minutes.toString().padStart(2, '0');
            document.getElementById("seconds").innerText = seconds.toString().padStart(2, '0');
        }
    }
}
setInterval(updateCountdown, 1000);
updateCountdown();

// Animation Initialization
document.addEventListener("DOMContentLoaded", () => {
    
    // 0. Dial out to database and silently retrieve the live Wish list
    fetchWishes();

    // 1. Initialize GSAP bounce on the Open Button
    bounceTween = gsap.to('.open-btn', {
        y: -12,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
    });

    // 2. Infinitely sway background scroll flowers relatively from their resting CSS rotation
    gsap.to('.scroll-flower', {
        rotation: "+=4", 
        duration: 4.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.5
    });

    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Scroll animations using GSAP ScrollTrigger
    const scrollElements = gsap.utils.toArray('.countdown-wrapper, .glass-panel, .glass-panel > *, .aturcara-panel > *, .doa-section > *, .wish-section > *');
    
    scrollElements.forEach(el => {
        // Headers get a gentle zoom-in, normal content gets a slide-up
        const isHeader = el.tagName.toLowerCase() === 'h2' || el.tagName.toLowerCase() === 'h3';
        
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 85%", // Trigger when top of element hits 85% down viewport
                toggleActions: "play none none reverse" // Replays seamlessly on scroll up and down
            },
            y: isHeader ? 0 : 50,
            scale: isHeader ? 0.8 : 1,
            opacity: 0,
            duration: 1.2,
            ease: "power2.out"
        });
    });


    // Reveal Inwards Effect for Details Section Flowers
    // Flowers start pushed outward (off-screen) and majestically assemble INWARDS to their resting CSS positions as you scroll!
    const detailsFlowers = [
        { selector: '.s-flower-1', x: 250, y: -200, rotation: 30 }, // Top Right flora starts far up-right
        { selector: '.s-flower-2', x: 200, y: -100, rotation: 20 }, // Mid Right flora starts far right
        { selector: '.s-flower-3', x: 250, y: 50, rotation: -15 },  // Lower Right flora starts far right
        { selector: '.s-flower-4', x: -250, y: 150, rotation: -25 },// Bottom Left flora starts far down-left
        { selector: '.s-flower-5', x: 200, y: 200, rotation: 35 }   // Bottom Right flora starts far down-right
    ];

    detailsFlowers.forEach(flower => {
        gsap.from(flower.selector, {
            scrollTrigger: {
                trigger: '.details-section',
                start: "top 90%", // Starts assembling right as the section enters the bottom of the screen
                end: "center center", // Fully assembled gracefully at their real CSS positions when centered
                scrub: true
            },
            x: flower.x,
            y: flower.y,
            rotation: flower.rotation,
            opacity: 0,
            ease: "none" // Crucial for smooth scrubbing
        });
    });

    gsap.to('.hero-section', {
        scrollTrigger: {
            trigger: '.hero-section',
            start: "top top",
            end: "bottom 30%",
            scrub: true // Ties the animation smoothly directly to the scrollbar
        },
        y: -80,
        opacity: 0,
        ease: "none"
    });
});

// Submit RSVP form and securely transmit data to Google Sheets via Apps Script Fetch API
function submitRSVP(event) {
    event.preventDefault();
    const form = document.getElementById('rsvpForm');
    const guestName = document.getElementById('rsvpName').value.trim();
    const wish = document.getElementById('rsvpWish').value.trim();
    const guests = document.getElementById('rsvpGuests').value;
    
    // IMPORTANT: Replace this placeholder with your generated Google Web App URL!
    const scriptURL = 'https://script.google.com/macros/s/AKfycbyECOWRFdPID9Zc0tfXIgvMaOpyM0QxVW66AxRfg5yKJ5_TrOp1u51CCnkY1lNVujKRbQ/exec';
    
    // Disabling button to prevent double-clicks during transmission loading time
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Sila Tunggu...";
    submitBtn.disabled = true;

    // Pack the fields identically to the Google Apps Script expected keys
    const formData = new FormData();
    formData.append('Name', guestName);
    formData.append('name', guestName);
    formData.append('Nama', guestName);
    formData.append('Name ', guestName);
    formData.append('#', guests);
    formData.append('Guest', wish);
    formData.append('Wish', wish); // Fallback

    // Start background sync seamlessly
    fetch(scriptURL, { method: 'POST', body: formData })
        .catch(error => console.error('Silent transmission error:', error.message));

    // --- INSTANT OPTIMISTIC UI ---
    if (wish !== '') {
        const wishBoard = document.getElementById('wishBoard');
        const emptyState = document.getElementById('emptyWishState');
        if (emptyState) emptyState.remove();

        const newWishHtml = `
            <div class="glass-panel wish-card new-wish">
                <p class="wish-message">"${wish}"</p>
                <p class="wish-name">- ${guestName}</p>
            </div>
        `;
        wishBoard.insertAdjacentHTML('afterbegin', newWishHtml);
        
        gsap.from('.new-wish', { y: 30, opacity: 0, duration: 0.8, ease: "power2.out" });
        setTimeout(() => {
            const el = document.querySelector('.new-wish');
            if (el) el.classList.remove('new-wish');
            ScrollTrigger.refresh();
        }, 100);
    }
    
    // Instantly update UI counters safely
    const elHadir = document.getElementById('countHadir');
    if (elHadir && !isNaN(parseInt(elHadir.innerText))) {
        let guestCount = parseInt(guests);
        if (isNaN(guestCount) || guestCount <= 0) guestCount = 1;
        elHadir.innerText = parseInt(elHadir.innerText) + guestCount;
    }

    alert('Success! Your RSVP and wishes have been permanently recorded.');
    closePopup();
    form.reset();
    submitBtn.innerText = originalText;
    submitBtn.disabled = false;
}

// Submit RSVP form explicitly for Tidak Hadir tracking
function submitRSVPTidak(event) {
    event.preventDefault();
    const form = document.getElementById('rsvpFormTidak');
    const guestName = document.getElementById('rsvpNameTidak').value.trim();
    const wish = document.getElementById('rsvpWishTidak').value.trim();
    
    const scriptURL = 'https://script.google.com/macros/s/AKfycbyECOWRFdPID9Zc0tfXIgvMaOpyM0QxVW66AxRfg5yKJ5_TrOp1u51CCnkY1lNVujKRbQ/exec';
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Sending securely...";
    submitBtn.disabled = true;

    const formData = new FormData();
    formData.append('Name', guestName);
    formData.append('name', guestName);
    formData.append('Nama', guestName);
    formData.append('Name ', guestName);
    formData.append('#', "Tidak Hadir");
    formData.append('Guest', wish);
    formData.append('Wish', wish);

    // Start background sync seamlessly
    fetch(scriptURL, { method: 'POST', body: formData })
        .catch(error => console.error('Silent transmission error:', error.message));

    // --- INSTANT OPTIMISTIC UI ---
    if (wish !== '') {
        const wishBoard = document.getElementById('wishBoard');
        const emptyState = document.getElementById('emptyWishState');
        if (emptyState) emptyState.remove();

        const newWishHtml = `
            <div class="glass-panel wish-card new-wish">
                <p class="wish-message">"${wish}"</p>
                <p class="wish-name">- ${guestName}</p>
            </div>
        `;
        wishBoard.insertAdjacentHTML('afterbegin', newWishHtml);
        
        gsap.from('.new-wish', { y: 30, opacity: 0, duration: 0.8, ease: "power2.out" });
        setTimeout(() => {
            const el = document.querySelector('.new-wish');
            if (el) el.classList.remove('new-wish');
            ScrollTrigger.refresh();
        }, 100);
    }
    
    // Instantly update UI counters safely
    const elTidak = document.getElementById('countTidakHadir');
    if (elTidak && !isNaN(parseInt(elTidak.innerText))) {
        elTidak.innerText = parseInt(elTidak.innerText) + 1;
    }

    alert('Terima kasih. RSVP anda telah direkodkan.');
    closePopup();
    form.reset();
    submitBtn.innerText = originalText;
    submitBtn.disabled = false;
}

// Submit Isolated Wish Form (Without RSVP incrementation)
function submitWishOnly(event) {
    event.preventDefault();
    const form = document.getElementById('wishFormOnly');
    const guestName = document.getElementById('wishNameOnly').value.trim();
    const wishMessage = document.getElementById('wishMessageOnly').value.trim();
    
    const scriptURL = 'https://script.google.com/macros/s/AKfycbyECOWRFdPID9Zc0tfXIgvMaOpyM0QxVW66AxRfg5yKJ5_TrOp1u51CCnkY1lNVujKRbQ/exec';
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Sila tunggu...";
    submitBtn.disabled = true;

    const formData = new FormData();
    formData.append('Name', guestName);
    formData.append('name', guestName);
    formData.append('Nama', guestName);
    formData.append('Name ', guestName);
    formData.append('#', "Hanya Ucapan"); // Explicitly safeguarding Google Sheet tracking logic
    formData.append('Guest', wishMessage);
    formData.append('Wish', wishMessage);

    // Start background sync seamlessly
    fetch(scriptURL, { method: 'POST', body: formData })
        .catch(error => console.error('Silent transmission error:', error.message));

    // --- INSTANT OPTIMISTIC UI ---
    if (wishMessage !== '') {
        const wishBoard = document.getElementById('wishBoard');
        const emptyState = document.getElementById('emptyWishState');
        if (emptyState) emptyState.remove();

        const newWishHtml = `
            <div class="glass-panel wish-card new-wish">
                <p class="wish-message">"${wishMessage}"</p>
                <p class="wish-name">- ${guestName}</p>
            </div>
        `;
        wishBoard.insertAdjacentHTML('afterbegin', newWishHtml);
        
        gsap.from('.new-wish', { y: 30, opacity: 0, duration: 0.8, ease: "power2.out" });
        setTimeout(() => {
            const el = document.querySelector('.new-wish');
            if (el) el.classList.remove('new-wish');
            ScrollTrigger.refresh();
        }, 100);
    }

    alert('Ucapan anda telah berjaya dihantar. Terima kasih!');
    closePopup();
    form.reset();
    submitBtn.innerText = originalText;
    submitBtn.disabled = false;
}

// Fetch existing wishes securely from Google Sheets on page load!
function fetchWishes() {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbyECOWRFdPID9Zc0tfXIgvMaOpyM0QxVW66AxRfg5yKJ5_TrOp1u51CCnkY1lNVujKRbQ/exec';
    const wishBoard = document.getElementById('wishBoard');
    
    fetch(scriptURL)
        .then(response => response.json())
        .then(res => {
            if (res.result === 'success' && res.data) {
                // Clear the hardcoded placeholder samples completely!
                wishBoard.innerHTML = '';
                
                // Reverse the array so the newest wishes dynamically spawn at the top of the wall!
                const wishes = res.data.reverse();
                let validWishesCount = 0;
                let hadirTotal = 0;
                let tidakHadirTotal = 0;
                
                wishes.forEach(row => {
                    // Extract safe name variable identically to UI fallback
                    const safeName = row.Name || row.name || row['Name '] || row.Nama;
                    
                    // Support both old headers and new headers ('#' and 'Guest')
                    const rsvpStatus = row['#'] !== undefined ? row['#'] : row.Guest;
                    const wishMsg = row['#'] !== undefined ? row.Guest : row.Wish;

                    // Categorize RSVPs intelligently
                    if (rsvpStatus === "Tidak Hadir" || rsvpStatus === "tidak hadir" || row.Guests === "Tidak Hadir") {
                        tidakHadirTotal++;
                    } else if (rsvpStatus === "Hanya Ucapan" || rsvpStatus === "hanya ucapan" || String(rsvpStatus).includes("Hanya Ucapan")) {
                        // Crucial: Do not increment Hadir/Tidak counters for isolated wishes!
                    } else if (safeName && safeName.trim() !== '') {
                        let guestCount = parseInt(rsvpStatus);
                        if (isNaN(guestCount) || guestCount <= 0) guestCount = 1;
                        hadirTotal += guestCount; // Sum the exact amount of guests
                    }

                    // Only render people who actually wrote a wish string mathematically
                    if (wishMsg && wishMsg.trim() !== '') {
                        const wishHtml = `
                            <div class="glass-panel wish-card">
                                <p class="wish-message">"${wishMsg}"</p>
                                <p class="wish-name">- ${safeName || 'Guest'}</p>
                            </div>
                        `;
                        wishBoard.insertAdjacentHTML('beforeend', wishHtml);
                        validWishesCount++;
                    }
                });
                
                // Inject the live counts straight into the DOM gracefully
                const elHadir = document.getElementById('countHadir');
                const elTidak = document.getElementById('countTidakHadir');
                if (elHadir) elHadir.innerText = hadirTotal;
                if (elTidak) elTidak.innerText = tidakHadirTotal;
                
                if (validWishesCount === 0) {
                    wishBoard.innerHTML = `
                        <div class="glass-panel wish-card" id="emptyWishState">
                            <p class="wish-message" style="font-style: normal; text-align: center; color: #777;">Be the first to leave a wish!</p>
                        </div>
                    `;
                }
                
                // Safely rebuild the entire page's GSAP scroll height constraints to accommodate the new DOM nodes!
                setTimeout(() => ScrollTrigger.refresh(), 500);
            }
        })
        .catch(error => console.error('Silent error fetching database wishes:', error));
}

// ═══════════════════════════════════════════════════════════════════
// Background Music — YouTube IFrame API (invait-style architecture)
// One hidden-but-mountable YT.Player. Cue on load, play on the
// "Open" gesture, toggle via the floating button, loop at song end.
// ═══════════════════════════════════════════════════════════════════

// Song config: video ID + start offset (seconds)
// Source URL: https://www.youtube.com/watch?v=yHKyno32R18
const MUSIC_VIDEO_ID = 'yHKyno32R18';
const MUSIC_START_SECONDS = 5;

window.ytPlayerReady = false;
window.ytApiReady = false;
let musicCued = false;

// Parse a YouTube URL/ID into a bare video ID (youtu.be / ?v= / /embed/ formats)
function extractVideoId(url) {
    const u = String(url || '').trim();
    let m = u.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/); if (m) return m[1];
    m = u.match(/[?&]v=([A-Za-z0-9_-]{6,})/);          if (m) return m[1];
    m = u.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/); if (m) return m[1];
    return /^[A-Za-z0-9_-]{6,}$/.test(u) ? u : null;
}

// Load the IFrame API once; onYouTubeIframeAPIReady creates the player
(function loadYouTubeApi() {
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => console.warn('YouTube API failed to load - music unavailable');
    document.head.appendChild(s);

    // Fallback: if the API never becomes ready, still mark the open flow done
    setTimeout(() => {
        if (!window.ytApiReady && !window.ytPlayerReady) console.warn('YouTube API not ready after 8s');
    }, 8000);
})();

window.onYouTubeIframeAPIReady = function () {
    window.ytApiReady = true;
    window.ytMusicPlayer = new YT.Player('ytPlayer', {
        width: 245,
        height: 138,
        videoId: MUSIC_VIDEO_ID,
        playerVars: {
            autoplay: 0,      // cue only - real playback starts on the Open gesture
            controls: 0,      // our own UI controls playback
            rel: 0,
            modestbranding: 1,
            playsinline: 1    // required for iOS inline playback
        },
        events: {
            onReady: () => {
                window.ytPlayerReady = true;
                // Cue at the song's start offset without playing (autoplay-safe)
                window.ytMusicPlayer.cueVideoById({
                    videoId: MUSIC_VIDEO_ID,
                    startSeconds: MUSIC_START_SECONDS
                });
                musicCued = true;
            },
            onStateChange: onMusicStateChange
        }
    });
};

// Mirror real player state into the button icon (single source of truth)
function onMusicStateChange(event) {
    const S = YT.PlayerState;
    if (event.data === S.PLAYING) {
        setMusicIcon(true);
    } else if (event.data === S.PAUSED || event.data === S.ENDED) {
        setMusicIcon(false);
        // Loop: restart from the song's start offset when it ends
        if (event.data === S.ENDED) {
            window.ytMusicPlayer.seekTo(MUSIC_START_SECONDS, true);
            window.ytMusicPlayer.playVideo();
        }
    }
}

function setMusicIcon(playing) {
    const icon = document.getElementById('audioIcon');
    const control = document.getElementById('audioControl');
    if (icon) {
        icon.className = 'material-symbols-outlined';
        icon.textContent = playing ? 'music_note' : 'music_off';
    }
    if (control) control.classList.toggle('muted', !playing);
}

// Start music - called from openInvitation() inside the user gesture chain
function startBackgroundMusic() {
    // Player created but not cued yet (API raced the Open click): play once ready
    if (window.ytApiReady && !window.ytPlayerReady) {
        const waitReady = setInterval(() => {
            if (window.ytPlayerReady) {
                clearInterval(waitReady);
                startBackgroundMusic();
            }
        }, 100);
        setTimeout(() => clearInterval(waitReady), 8000);
        return;
    }
    if (!window.ytPlayerReady || !window.ytMusicPlayer) return;
    try {
        window.ytMusicPlayer.unMute();
        if (musicCued) {
            window.ytMusicPlayer.playVideo();
        } else {
            window.ytMusicPlayer.loadVideoById({
                videoId: MUSIC_VIDEO_ID,
                startSeconds: MUSIC_START_SECONDS
            });
            musicCued = true;
        }
    } catch (e) {
        console.warn('Music start failed:', e);
    }
}

// Floating button toggle: when collapsed the first click just opens the
// panel; once expanded the icon is a real play/pause. The icon always
// reflects actual player state via onStateChange.
function toggleAudio() {
    const control = document.getElementById('audioControl');
    if (control && !control.classList.contains('expanded')) {
        control.classList.add('expanded');
        return;
    }
    if (!window.ytPlayerReady || !window.ytMusicPlayer) {
        // Not ready yet: start it as soon as this gesture allows
        startBackgroundMusic();
        return;
    }
    const state = window.ytMusicPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        window.ytMusicPlayer.pauseVideo();   // icon updates via onStateChange
    } else {
        window.ytMusicPlayer.unMute();
        window.ytMusicPlayer.playVideo();
    }
}

// Audio Panel: expand/collapse the icon into a big panel on click
(function () {
    const audioControl = document.getElementById('audioControl');
    if (!audioControl) return;

    audioControl.addEventListener('click', (e) => {
        // Ignore clicks that came from the inner toggle button (it has its own handler)
        if (e.target.closest('.audio-toggle')) return;
        const expanding = !audioControl.classList.contains('expanded');
        audioControl.classList.toggle('expanded', expanding);
        e.stopPropagation();
    });

    document.addEventListener('click', (e) => {
        if (audioControl.classList.contains('expanded') && !audioControl.contains(e.target)) {
            audioControl.classList.remove('expanded');
        }
    });
})();

// Scroll Hint: hidden only by the timed fade in openInvitation(); scrolling no longer affects it
