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
   1b. SCROLL SPY & SCROLLED HEADER
   ========================================================================== */
function initScrollSpy() {
    const header = document.getElementById('main-header');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    // Add scrolled class to header
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Skip scroll spy state synchronization if programmatic scroll is in progress
        if (window.isProgrammaticScrolling) {
            return;
        }

        // Active link highlighting based on current section viewport position
        let currentSection = 'home';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            if (window.scrollY >= sectionTop) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `/${currentSection}` || href === `#${currentSection}`) {
                link.classList.add('active');
            }
        });

        // Keep URL pathname in browser address bar fully synchronized with scrolled section (on servers only)
        if (window.location.protocol !== 'file:') {
            const targetPath = '/' + currentSection;
            if (window.location.pathname !== targetPath) {
                window.history.replaceState(null, null, targetPath);
            }
        }
    });
}

/* ==========================================================================
   1c. HTML5 HISTORY API ROUTING (HYBRID ROUTER)
   ========================================================================== */
function initRouting() {
    // If double-clicked locally as a file, let standard browser native anchors handle scroll
    if (window.location.protocol === 'file:') {
        return;
    }

    const spaPaths = ['/home', '/about', '/services', '/contact'];

    // Instant scroll to target sections with standard offset (no delay animation)
    function scrollToSection(sectionId, smooth = false) {
        if (sectionId === 'home') {
            window.scrollTo({
                top: 0,
                behavior: smooth ? 'smooth' : 'auto'
            });
            return;
        }

        const element = document.getElementById(sectionId);
        if (element) {
            const header = document.getElementById('main-header');
            const headerOffset = header ? header.offsetHeight : 80;
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerOffset + 2;

            window.scrollTo({
                top: offsetPosition,
                behavior: smooth ? 'smooth' : 'auto'
            });
        }
    }

    // Intercept clicks on HTML relative hash anchors (like href="#about")
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href) return;

        // Check if the link targets one of our known sections
        if (href.startsWith('#')) {
            const targetId = href.substring(1);
            const knownSections = ['home', 'about', 'services', 'contact'];

            if (knownSections.includes(targetId)) {
                e.preventDefault();

                // Update active states on menu links immediately for snappier feedback
                const navLinks = document.querySelectorAll('.nav-link');
                navLinks.forEach(nl => {
                    nl.classList.remove('active');
                    if (nl.getAttribute('href') === href) {
                        nl.classList.add('active');
                    }
                });

                // Set programmatic flag to block scroll spy recalculations during jump
                window.isProgrammaticScrolling = true;

                // Update the address bar URL to a clean slash path (e.g., /about)
                window.history.pushState(null, null, '/' + targetId);

                // Trigger instant scroll (no time gap animation)
                scrollToSection(targetId, false);

                // Release flag after the scroll jump is complete
                setTimeout(() => {
                    window.isProgrammaticScrolling = false;
                }, 50);
            }
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        const path = window.location.pathname;
        if (spaPaths.includes(path)) {
            const targetId = path.substring(1);
            
            // Set programmatic flag
            window.isProgrammaticScrolling = true;

            // Update active menu link
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(nl => {
                nl.classList.remove('active');
                if (nl.getAttribute('href') === '#' + targetId) {
                    nl.classList.add('active');
                }
            });

            scrollToSection(targetId, false);

            setTimeout(() => {
                window.isProgrammaticScrolling = false;
            }, 50);
        }
    });

    // Handle initial direct page load or refreshes (via Vercel rewrites)
    const initialPath = window.location.pathname;
    if (spaPaths.includes(initialPath)) {
        const targetId = initialPath.substring(1);
        
        window.isProgrammaticScrolling = true;

        // Update active menu link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(nl => {
            nl.classList.remove('active');
            if (nl.getAttribute('href') === '#' + targetId) {
                nl.classList.add('active');
            }
        });

        scrollToSection(targetId, false); // Instant snap on initial direct entry
        document.documentElement.classList.remove('route-loading');

        setTimeout(() => {
            window.isProgrammaticScrolling = false;
        }, 50);
    } else {
        if (initialPath === '/' || initialPath === '/index.html') {
            window.history.replaceState(null, null, '/home');
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



