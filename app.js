document.addEventListener('DOMContentLoaded', () => {
    // Initialize standard functionalities
    initScrollSpy();
    initMobileNav();
    initReviewsCarousel();
    initAboutCarousel();
    initContactForm();
    initRouting();
});

/* ==========================================================================
   1b. SCROLL SPY & SCROLLED HEADER (IntersectionObserver Powered)
   ========================================================================== */
function initScrollSpy() {
    const header = document.getElementById('main-header');

    // Add scrolled class to header (highly optimized passive scroll listener)
    window.addEventListener('scroll', () => {
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    }, { passive: true });

    // Use IntersectionObserver to track visible sections and highlight nav links
    const spaPaths = ['home', 'about', 'services', 'contact'];
    const sections = spaPaths.map(id => document.getElementById(id)).filter(Boolean);

    if (sections.length === 0) return;

    // Track active intersections
    const activeIntersections = new Map();

    const observerOptions = {
        root: null, // viewport
        rootMargin: '-20% 0px -40% 0px', // detects when section is in the middle reading area
        threshold: [0, 0.1, 0.2]
    };

    const observerCallback = (entries) => {
        // Skip scroll spy state synchronization if programmatic scroll (link click / popstate) is in progress
        if (window.isProgrammaticScrolling) return;

        entries.forEach(entry => {
            if (entry.isIntersecting) {
                activeIntersections.set(entry.target.id, entry.intersectionRatio);
            } else {
                activeIntersections.delete(entry.target.id);
            }
        });

        // Determine the most visible section
        let activeSectionId = null;
        let maxRatio = -1;

        activeIntersections.forEach((ratio, id) => {
            if (ratio > maxRatio) {
                maxRatio = ratio;
                activeSectionId = id;
            }
        });

        // Fallback: If scrolled to absolute top, guarantee "home" section is active
        if (window.scrollY < 80) {
            activeSectionId = 'home';
        }

        if (activeSectionId) {
            // Update nav links classes
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                if (link.getAttribute('data-scroll') === activeSectionId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            // Update browser history (only on servers, bypass on file://)
            if (window.location.protocol !== 'file:') {
                const targetPath = '/' + activeSectionId;
                if (window.location.pathname !== targetPath) {
                    window.history.replaceState({ sectionId: activeSectionId }, null, targetPath);
                }
            }
        }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach(section => observer.observe(section));
}

/* ==========================================================================
   1c. HTML5 HISTORY API ROUTING & SMOOTH SCROLLING
   ========================================================================== */
function initRouting() {
    const spaPaths = ['/home', '/about', '/services', '/contact'];

    // Smoothly scrolls to section and releases programmatic lock when complete
    function scrollToSection(sectionId, usePushState = false) {
        const element = document.getElementById(sectionId);
        if (!element) return;

        // Block IntersectionObserver updates while programmatic scroll is in progress
        window.isProgrammaticScrolling = true;

        // Instantly update navbar states for crisp user response
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.getAttribute('data-scroll') === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Update history states
        if (usePushState && window.location.protocol !== 'file:') {
            window.history.pushState({ sectionId }, null, '/' + sectionId);
        }

        // Perform native smooth scroll
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Safely release the scroll spy lock using the modern 'scrollend' event or a fallback timeout
        let isReleased = false;
        const releaseLock = () => {
            if (isReleased) return;
            isReleased = true;
            window.isProgrammaticScrolling = false;
            window.removeEventListener('scrollend', releaseLock);
        };

        window.addEventListener('scrollend', releaseLock);
        setTimeout(releaseLock, 1000); // safety fallback for older browsers
    }

    // Intercept clicks on links configured with [data-scroll]
    document.addEventListener('click', (e) => {
        const scrollLink = e.target.closest('[data-scroll]');
        if (!scrollLink) return;

        // Skip default page load jump
        e.preventDefault();

        const sectionId = scrollLink.getAttribute('data-scroll');
        scrollToSection(sectionId, true);

        // Auto close mobile navigation menus
        const burger = document.getElementById('menu-burger');
        const navMenu = document.getElementById('nav-menu');
        if (burger && navMenu) {
            burger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });

    // Listen to browser Back and Forward navigation pops
    window.addEventListener('popstate', (e) => {
        const path = window.location.pathname;
        if (spaPaths.includes(path)) {
            const targetId = path.substring(1);
            scrollToSection(targetId, false); // scroll to section without pushing additional history states
        } else if (path === '/' && window.location.protocol !== 'file:') {
            scrollToSection('home', false);
        }
    });

    // Handle initial direct page load or refreshes (via server rewrites)
    const initialPath = window.location.pathname;
    if (spaPaths.includes(initialPath)) {
        const targetId = initialPath.substring(1);
        
        window.isProgrammaticScrolling = true;

        // Setup navbar active highlight
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.getAttribute('data-scroll') === targetId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Delay scroll slightly to ensure DOM coordinates are completely resolved
        setTimeout(() => {
            const element = document.getElementById(targetId);
            if (element) {
                element.scrollIntoView({ behavior: 'auto' }); // instant jump on cold start for premium snappiness
            }
            document.documentElement.classList.remove('route-loading');
            
            setTimeout(() => {
                window.isProgrammaticScrolling = false;
            }, 100);
        }, 100);
    } else {
        // Fallback rewriting default paths to /home
        if ((initialPath === '/' || initialPath === '/index.html') && window.location.protocol !== 'file:') {
            window.history.replaceState({ sectionId: 'home' }, null, '/home');
        }
        document.documentElement.classList.remove('route-loading');
    }
}

/* ==========================================================================
   2. MOBILE NAV MENU
   ========================================================================== */
function initMobileNav() {
    const burger = document.getElementById('menu-burger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileCta = document.getElementById('mobile-nav-cta');

    burger.addEventListener('click', () => {
        burger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            burger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    if (mobileCta) {
        mobileCta.addEventListener('click', () => {
            burger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    }
}

/* ==========================================================================
   3. SERVICES DATA AND DETAIL MODALS
   ========================================================================== */
// const SERVICES_DATA = {
//     general: {
//         title: "General Dentistry",
//         icon: "🦷",
//         desc: "Protect and maintain your oral health with standard diagnostics, custom fillings, and pain-free preventative maintenance.",
//         list: [
//             "Comprehensive Intraoral 3D Examinations",
//             "Painless Dental Filling Solutions (Composite Resins)",
//             "Plaque and Tartar Removal (Ultrasonic Scaling)",
//             "Professional Fluoride Sealants to Prevent Cavities",
//             "Advanced Digital Low-Radiation X-Rays"
//         ]
//     },
//     orthodontics: {
//         title: "Orthodontics",
//         icon: "📐",
//         desc: "Straighten misaligned teeth and fix jaw issues using state-of-the-art brackets or premium clear alignment structures.",
//         list: [
//             "Comfortable Custom Clear Invisalign® Aligners",
//             "Ceramic Aesthetic Self-Ligating Braces",
//             "Traditional High-Performance Metal Braces",
//             "Early Interceptive Pediatric Jaw Alignments",
//             "Post-Treatment Retainers & Structural Guides"
//         ]
//     },
//     implants: {
//         title: "Dental Implants",
//         icon: "🔩",
//         desc: "Permanent tooth replacement solutions designed to match your jaw shape, restoring chew strength and confidence.",
//         list: [
//             "High-Strength Premium Swiss Titanium Implant Rods",
//             "Same-Day Single Tooth Missing Extractions & Placements",
//             "All-on-4® and All-on-6® Full-Mouth Arches",
//             "3D Digital Guided Surgical Dental Operations",
//             "Advanced Sinus Lift & Bone Grafting Diagnostics"
//         ]
//     },
//     cosmetic: {
//         title: "Cosmetic Smile Makeover",
//         icon: "✨",
//         desc: "Design the gorgeous, bright smile of your dreams with certified veneers, whitening options, and structural adjustments.",
//         list: [
//             "Custom Porcelain Veneers & Lumineers®",
//             "In-Office Philips Zoom® Laser Teeth Whitening",
//             "Composite Enamel Bonding & Chip Restorations",
//             "Laser Gum Contouring & Aesthetic Reshaping",
//             "Complete Digital Smile Previewing Design Suite"
//         ]
//     },
//     pediatric: {
//         title: "Pediatric Dentistry",
//         icon: "👶",
//         desc: "Specialized, warm, and highly playful dental procedures aimed at keeping children happy and safe while growing healthy teeth.",
//         list: [
//             "Child-Friendly Teeth Cleaning & Habit Coaching",
//             "Cavity Protective Dental Paint-on Sealants",
//             "Ultra-Gentle Painless Baby Tooth Extractions",
//             "Space Maintainers for Emerging Permanent Teeth",
//             "Fun Interactive Reward & Praise Clinics"
//         ]
//     },
//     surgery: {
//         title: "Oral Surgery & Root Canal",
//         icon: "🔬",
//         desc: "Microscopic surgical root procedures or tooth extractions performed with precision diagnostics for instant toothache relief.",
//         list: [
//             "Microscope-Guided Single-Sitting Root Canal Treatments",
//             "Impacted Wisdom Teeth Painless Extractions",
//             "Emergency Treatment for Abscesses or Deep Infection",
//             "Sedation Dentistry & Sleep Breathing Management",
//             "Apicoectomy & Specialized Root Surgery Procedures"
//         ]
//     }
// };

function openServiceModal(serviceKey) {
    const data = SERVICES_DATA[serviceKey];
    if (!data) return;

    document.getElementById('modal-service-icon').innerText = data.icon;
    document.getElementById('modal-service-title').innerText = data.title;
    document.getElementById('modal-service-desc').innerText = data.desc;

    const listContainer = document.getElementById('modal-service-list');
    listContainer.innerHTML = '';

    data.list.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
            </svg>
            ${item}
        `;
        listContainer.appendChild(li);
    });

    document.getElementById('service-detail-modal').classList.add('active');
    document.body.style.overflow = 'hidden'; // stop background scroll
}

function closeServiceModal() {
    document.getElementById('service-detail-modal').classList.remove('active');
    document.body.style.overflow = ''; // restore background scroll
}

// Attach functions to window for onclick HTML attribute calls
window.openServiceModal = openServiceModal;
window.closeServiceModal = closeServiceModal;


/* ==========================================================================
   4. REVIEWS CAROUSEL
   ========================================================================== */
let currentSlideIndex = 0;
let slideInterval;

function initReviewsCarousel() {
    const container = document.getElementById('testimonials-slides-container');
    if (!container) return;

    startCarouselAutoPlay();

    // Pause autoplay on mouse hover
    const wrapper = document.querySelector('.testimonials-carousel-wrapper');
    wrapper.addEventListener('mouseenter', () => clearInterval(slideInterval));
    wrapper.addEventListener('mouseleave', startCarouselAutoPlay);
}

function startCarouselAutoPlay() {
    slideInterval = setInterval(() => {
        jumpToSlide((currentSlideIndex + 1) % 3);
    }, 5500);
}

function jumpToSlide(index) {
    const container = document.getElementById('testimonials-slides-container');
    const dots = document.querySelectorAll('#carousel-dots-list .indicator');

    if (!container) return;

    currentSlideIndex = index;
    container.style.transform = `translateX(-${index * 100}%)`;

    dots.forEach((dot, idx) => {
        if (idx === index) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

window.jumpToSlide = jumpToSlide;


/* ==========================================================================
   4a. ABOUT SECTION (WHO WE ARE) CAROUSEL
   ========================================================================== */
let currentAboutSlideIndex = 0;
let aboutSlideInterval;
const totalAboutSlides = 2;

function initAboutCarousel() {
    const container = document.getElementById('about-carousel-slides');
    if (!container) return;

    startAboutCarouselAutoPlay();

    // Pause autoplay on mouse hover
    const wrapper = document.getElementById('about-carousel-container');
    if (wrapper) {
        wrapper.addEventListener('mouseenter', () => clearInterval(aboutSlideInterval));
        wrapper.addEventListener('mouseleave', startAboutCarouselAutoPlay);
    }
}

function startAboutCarouselAutoPlay() {
    aboutSlideInterval = setInterval(() => {
        nextAboutSlide();
    }, 5000);
}

function nextAboutSlide() {
    jumpToAboutSlide((currentAboutSlideIndex + 1) % totalAboutSlides);
}

function prevAboutSlide() {
    jumpToAboutSlide((currentAboutSlideIndex - 1 + totalAboutSlides) % totalAboutSlides);
}

function jumpToAboutSlide(index) {
    const container = document.getElementById('about-carousel-slides');
    const indicators = document.querySelectorAll('.about-carousel-indicators .about-indicator');

    if (!container) return;

    currentAboutSlideIndex = index;
    container.style.transform = `translateX(-${index * 100}%)`;

    indicators.forEach((indicator, idx) => {
        if (idx === index) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

// Expose to window context for inline onclick handlers
window.nextAboutSlide = nextAboutSlide;
window.prevAboutSlide = prevAboutSlide;
window.jumpToAboutSlide = jumpToAboutSlide;


/* ==========================================================================
   5. CONTACT FORM HANDLER (WITH AJAX SUBMIT & FILE PROTOCOL INTERCEPT)
   ========================================================================== */
function initContactForm() {
    const form = document.getElementById('clinic-contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        // 1. Detect if browsing as local file
        if (window.location.protocol === 'file:') {
            e.preventDefault();
            showFormStatusModal(
                '⚠️',
                'Local File Restrictions',
                `You are currently viewing this page directly as a local HTML file (<code>file://</code>).<br><br>` +
                `<strong>Google Apps Script Web App submissions require a web server</strong> (accessed via <code>http://</code> or <code>https://</code>) to securely forward messages.<br><br>` +
                `💡 <strong>Don't worry!</strong> Once this website is hosted online (e.g. on Netlify, Vercel, or GitHub Pages), this contact form will work <strong>100% perfectly</strong>.<br><br>` +
                `🛠️ <strong>To test it locally:</strong> Open this folder in VS Code and use the <strong>Live Server</strong> extension, or run <code>npx serve</code> or <code>python3 -m http.server</code> in this folder from your terminal.`,
                'Okay, Got It'
            );
            return;
        }

        // 2. Perform AJAX submission if on a web server
        e.preventDefault();

        const submitBtn = document.getElementById('contact-submit-btn');
        if (!submitBtn) return;

        const actionUrl = form.getAttribute('action') || '';

        // Check if user still has the placeholder action ID
        if (!actionUrl || actionUrl.includes('YOUR_APPS_SCRIPT_ID')) {
            showFormStatusModal(
                '⚙️',
                'Configuration Required',
                `Your contact form is almost ready!<br><br>` +
                `To complete the setup, please copy your deployed **Google Apps Script Web App URL** and paste it into the <code>action</code> attribute of the form in <code>index.html</code>.<br><br>` +
                `💡 Detailed step-by-step instructions have been saved in <strong>GoogleAppsScript.gs</strong> in your project directory.`,
                'Okay, Got It'
            );
            return;
        }

        // Save original button content and disable
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.8';
        submitBtn.innerHTML = `
            Sending...
            <span class="btn-spinner"></span>
        `;

        // Serialize Form Data as URLSearchParams to avoid preflight CORS OPTIONS requests
        const params = new URLSearchParams();
        const formData = new FormData(form);
        formData.forEach((value, key) => {
            params.append(key, value);
        });

        fetch(actionUrl, {
            method: 'POST',
            body: params,
            headers: {
                'Accept': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(json => {
                // Restore button
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.innerHTML = originalBtnHTML;

                if (json.result === 'success' || json.success === true) {
                    // Success!
                    form.reset();
                    showFormStatusModal(
                        '✅',
                        'Message Sent Successfully!',
                        'Thank you for reaching out to Al Kalam Dental Clinic. Our team has received your message and will get back to you shortly.',
                        'Great!'
                    );
                } else {
                    throw new Error(json.message || 'Submission failed');
                }
            })
            .catch(error => {
                console.error('Submission error:', error);
                // Restore button
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.innerHTML = originalBtnHTML;

                // Show error popup
                showFormStatusModal(
                    '❌',
                    'Submission Failed',
                    `Something went wrong while sending your inquiry.<br><br>` +
                    `Please double-check your connection, or contact us directly at <strong>+91 94954 90821</strong> or via email at <strong>drckrahman@gmail.com</strong>.`,
                    'Try Again'
                );
            });
    });
}

function showFormStatusModal(icon, title, desc, actionText = 'Okay') {
    const modal = document.getElementById('form-status-modal');
    if (!modal) return;

    document.getElementById('form-status-icon').innerHTML = icon;
    document.getElementById('form-status-title').innerText = title;
    document.getElementById('form-status-desc').innerHTML = desc;

    const actionBtn = modal.querySelector('#form-status-action button');
    if (actionBtn) {
        actionBtn.innerText = actionText;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // stop background scroll
}

function closeFormStatusModal() {
    const modal = document.getElementById('form-status-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // restore background scroll
    }
}

// Expose functions to window
window.closeFormStatusModal = closeFormStatusModal;



