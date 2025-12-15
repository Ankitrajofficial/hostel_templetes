// Main Interactivity for MK HEIGHT

// Check authentication state and update navbar
function checkAuthState() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const signinBtn = document.querySelector('.nav-signin');
  
  if (token && userStr && signinBtn) {
    try {
      const user = JSON.parse(userStr);
      
      // Create user menu container
      const userMenu = document.createElement('div');
      userMenu.className = 'nav-user-menu';
      userMenu.innerHTML = `
        <div class="nav-user-btn">
          <i class="fa-solid fa-user-circle"></i>
          <span class="nav-user-name">${user.name.split(' ')[0]}</span>
          <i class="fa-solid fa-chevron-down"></i>
        </div>
        <div class="nav-user-dropdown">
          <div class="nav-user-info">
            <i class="fa-solid fa-user"></i>
            <span>${user.name}</span>
          </div>
          <div class="nav-user-email">
            <i class="fa-solid fa-envelope"></i>
            <span>${user.email}</span>
          </div>
          <hr>
          ${user.role !== 'student' ? '<a href="/admin" class="nav-user-item"><i class="fa-solid fa-gauge-high"></i> Admin Panel</a>' : ''}
          <button class="nav-user-item nav-logout-btn" onclick="handleLogout()">
            <i class="fa-solid fa-right-from-bracket"></i> Sign Out
          </button>
        </div>
      `;
      
      // Replace sign-in button with user menu
      signinBtn.parentElement.replaceChild(userMenu, signinBtn);
      
      // Toggle dropdown on click
      const userBtn = userMenu.querySelector('.nav-user-btn');
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenu.classList.toggle('active');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        userMenu.classList.remove('active');
      });
      
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
}

// Handle logout
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  // Check authentication state
  checkAuthState();
  
  // Fetch site settings (Trial Stay banner, etc.)
  fetchSiteSettings();
  
  // Mobile Navigation Toggle
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      hamburger.classList.toggle("toggle");
    });
  }

  // Lightbox Logic
  function openLightbox(element) {
      const lightbox = document.getElementById('lightbox');
      const lightboxImg = document.getElementById('lightbox-img');
      const captionText = document.getElementById('lightbox-caption');
      
      // Get image inside the clicked element
      const img = element.querySelector('img');
      
      lightbox.style.display = "block";
      lightboxImg.src = img.src;
      captionText.innerHTML = img.getAttribute('data-caption') || img.alt;
  }

  function closeLightbox() {
      document.getElementById('lightbox').style.display = "none";
  }

  // ============================================
  // HERO CAROUSEL LOGIC
  // ============================================
  const heroSlides = document.querySelectorAll('.hero-slide');
  const heroDots = document.querySelectorAll('.hero-dot');
  const heroPrevBtn = document.querySelector('.hero-prev');
  const heroNextBtn = document.querySelector('.hero-next');
  const heroTrack = document.querySelector('.hero-slider-track');
  let currentHeroSlide = 0;

  function showHeroSlide(index) {
      if (heroSlides.length === 0) return;
      // Wrap around
      if (index >= heroSlides.length) currentHeroSlide = 0;
      else if (index < 0) currentHeroSlide = heroSlides.length - 1;
      else currentHeroSlide = index;

      // Slide the track
      if (heroTrack) {
          heroTrack.style.transform = `translateX(-${currentHeroSlide * 100}%)`;
      }

      // Update dots
      heroDots.forEach((dot, i) => {
          dot.classList.toggle('active', i === currentHeroSlide);
      });
  }

  if (heroPrevBtn) {
      heroPrevBtn.addEventListener('click', () => showHeroSlide(currentHeroSlide - 1));
  }
  if (heroNextBtn) {
      heroNextBtn.addEventListener('click', () => showHeroSlide(currentHeroSlide + 1));
  }
  heroDots.forEach(dot => {
      dot.addEventListener('click', () => {
          showHeroSlide(parseInt(dot.dataset.index));
      });
  });

  // Auto-slide for hero carousel every 6 seconds
  if (heroSlides.length > 0) {
      setInterval(() => {
          showHeroSlide(currentHeroSlide + 1);
      }, 6000);
  }

  // ============================================
  // GALLERY SLIDER LOGIC (existing)
  // ============================================
  const slides = document.querySelectorAll('.fullwidth-slider-section .slide');
  const dots = document.querySelectorAll('.fullwidth-slider-section .dot');
  const prevBtn = document.querySelector('.slider-prev');
  const nextBtn = document.querySelector('.slider-next');
  const sliderTrack = document.querySelector('.fullwidth-slider-section .slider-track');
  let currentSlide = 0;

  function showSlide(index) {
      if (slides.length === 0) return;
      // Wrap around
      if (index >= slides.length) currentSlide = 0;
      else if (index < 0) currentSlide = slides.length - 1;
      else currentSlide = index;

      // Slide the track
      if (sliderTrack) {
          sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
      }

      // Update dots
      dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === currentSlide);
      });
  }

  if (prevBtn) {
      prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));
  }
  if (nextBtn) {
      nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
  }
  dots.forEach(dot => {
      dot.addEventListener('click', () => {
          showSlide(parseInt(dot.dataset.index));
      });
  });

  // Auto-slide for gallery slider every 5 seconds
  if (slides.length > 0) {
      setInterval(() => {
          showSlide(currentSlide + 1);
      }, 5000);
  }

  // Smooth Scroll for Anchor Links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
        });
        // Close mobile menu if open
        navLinks.classList.remove("active");
        if (hamburger) hamburger.classList.remove("toggle");
      }
    });
  });

  // Navbar Scroll Effect - Keep solid background, just add shadow on scroll
  const navbar = document.querySelector(".navbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.style.boxShadow = "0 10px 30px -10px rgba(2, 12, 27, 0.7)";
    } else {
      navbar.style.boxShadow = "0 2px 10px rgba(0,0,0,0.3)";
    }
  });

  // ============================================
  // SIGN IN MODAL LOGIC
  // ============================================
  
  // Get sign-in elements
  const signinBtn = document.querySelector('.nav-signin');
  const signinModal = document.getElementById('signinModal');
  const signinForm = document.getElementById('signinForm');
  const signinError = document.getElementById('signinError');

  // Open sign-in modal
  if (signinBtn) {
    signinBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openSigninModal();
    });
  }

  // Sign-in form submission
  if (signinForm) {
    signinForm.addEventListener('submit', handleSignin);
  }

  // Close modal when clicking outside
  if (signinModal) {
    signinModal.addEventListener('click', (e) => {
      if (e.target === signinModal) {
        closeSigninModal();
      }
    });
  }

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && signinModal?.classList.contains('active')) {
      closeSigninModal();
    }
  });
});

// Sign-in modal functions (global scope)
function openSigninModal() {
  const modal = document.getElementById('signinModal');
  const error = document.getElementById('signinError');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Reset form
    document.getElementById('signinForm')?.reset();
    if (error) {
      error.classList.remove('show');
      error.textContent = '';
    }
  }
}

function closeSigninModal() {
  const modal = document.getElementById('signinModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

async function handleSignin(e) {
  e.preventDefault();
  
  const email = document.getElementById('signinEmail').value;
  const password = document.getElementById('signinPassword').value;
  const errorDiv = document.getElementById('signinError');
  const submitBtn = document.querySelector('#signinFormContainer .signin-btn');
  
  // Reset error
  errorDiv.classList.remove('show');
  errorDiv.textContent = '';
  
  // Show loading state
  const originalBtnContent = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';
  submitBtn.disabled = true;
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Close modal and redirect based on role
      closeSigninModal();
      if (data.user.role === 'student') {
        // Students stay on main page (or student dashboard in future)
        window.location.reload();
      } else {
        window.location.href = '/admin';
      }
    } else {
      errorDiv.textContent = data.message || 'Login failed';
      errorDiv.classList.add('show');
    }
  } catch (error) {
    errorDiv.textContent = 'Connection error. Please try again.';
    errorDiv.classList.add('show');
  } finally {
    submitBtn.innerHTML = originalBtnContent;
    submitBtn.disabled = false;
  }
}

// Switch between Sign In and Sign Up tabs
function switchAuthTab(tab) {
  const signinContainer = document.getElementById('signinFormContainer');
  const signupContainer = document.getElementById('signupFormContainer');
  const signinTab = document.querySelector('.auth-tab[data-tab="signin"]');
  const signupTab = document.querySelector('.auth-tab[data-tab="signup"]');
  
  if (tab === 'signin') {
    signinContainer.classList.add('active');
    signupContainer.classList.remove('active');
    signinTab.classList.add('active');
    signupTab.classList.remove('active');
  } else {
    signinContainer.classList.remove('active');
    signupContainer.classList.add('active');
    signinTab.classList.remove('active');
    signupTab.classList.add('active');
  }
  
  // Clear any error/success messages
  document.getElementById('signinError')?.classList.remove('show');
  document.getElementById('signupError')?.classList.remove('show');
  document.getElementById('signupSuccess')?.classList.remove('show');
}

// Handle Sign Up form submission
document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
});

async function handleSignup(e) {
  e.preventDefault();
  
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const phone = document.getElementById('signupPhone').value;
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupConfirmPassword').value;
  const errorDiv = document.getElementById('signupError');
  const successDiv = document.getElementById('signupSuccess');
  const submitBtn = document.querySelector('#signupFormContainer .signin-btn');
  
  // Reset messages
  errorDiv.classList.remove('show');
  errorDiv.textContent = '';
  successDiv.classList.remove('show');
  successDiv.textContent = '';
  
  // Validate passwords match
  if (password !== confirmPassword) {
    errorDiv.textContent = 'Passwords do not match';
    errorDiv.classList.add('show');
    return;
  }
  
  // Show loading state
  const originalBtnContent = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';
  submitBtn.disabled = true;
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, phone, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      successDiv.textContent = 'Account created successfully! Please sign in.';
      successDiv.classList.add('show');
      
      // Reset form
      document.getElementById('signupForm').reset();
      
      // Switch to sign in after 2 seconds
      setTimeout(() => {
        switchAuthTab('signin');
        // Pre-fill email
        document.getElementById('signinEmail').value = email;
      }, 2000);
    } else {
      errorDiv.textContent = data.message || 'Registration failed';
      errorDiv.classList.add('show');
    }
  } catch (error) {
    errorDiv.textContent = 'Connection error. Please try again.';
    errorDiv.classList.add('show');
  } finally {
    submitBtn.innerHTML = originalBtnContent;
    submitBtn.disabled = false;
  }
}

// Google Sign-In Configuration
const GOOGLE_CLIENT_ID = '603456067130-ck0m4ip7eqobuehmc1hckfrq34c99umg.apps.googleusercontent.com';

// Handle Google Sign-In button click
function handleGoogleSignIn() {
  // Initialize Google Sign-In
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true
  });
  
  // Show the One Tap / popup dialog
  google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // If One Tap is not displayed, use popup mode
      google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile',
        callback: handleGoogleTokenResponse
      }).requestAccessToken();
    }
  });
}

// Handle credential response from Google Sign-In
async function handleGoogleCredentialResponse(response) {
  const errorDiv = document.getElementById('signinError') || document.getElementById('signupError');
  
  try {
    const result = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ credential: response.credential })
    });
    
    const data = await result.json();
    
    if (result.ok) {
      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Close modal and redirect
      closeSigninModal();
      if (data.user.role === 'student') {
        window.location.reload();
      } else {
        window.location.href = '/admin';
      }
    } else {
      if (errorDiv) {
        errorDiv.textContent = data.message || 'Google sign-in failed';
        errorDiv.classList.add('show');
      }
    }
  } catch (error) {
    if (errorDiv) {
      errorDiv.textContent = 'Connection error. Please try again.';
      errorDiv.classList.add('show');
    }
  }
}

// Handle token response (for popup mode fallback)
async function handleGoogleTokenResponse(tokenResponse) {
  const errorDiv = document.getElementById('signinError') || document.getElementById('signupError');
  
  try {
    // Get user info using the access token
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
    });
    
    const userInfo = await userInfoResponse.json();
    
    // Send to our backend
    const result = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        googleUser: {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          sub: userInfo.sub
        }
      })
    });
    
    const data = await result.json();
    
    if (result.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      closeSigninModal();
      if (data.user.role === 'student') {
        window.location.reload();
      } else {
        window.location.href = '/admin';
      }
    } else {
      if (errorDiv) {
        errorDiv.textContent = data.message || 'Google sign-in failed';
        errorDiv.classList.add('show');
      }
    }
  } catch (error) {
    if (errorDiv) {
      errorDiv.textContent = 'Connection error. Please try again.';
      errorDiv.classList.add('show');
    }
  }
}

// ============================================
// SITE SETTINGS - Trial Stay Banner
// ============================================

async function fetchSiteSettings() {
  try {
    const response = await fetch('/api/settings');
    
    if (response.ok) {
      const settings = await response.json();
      
      // Handle Trial Stay Banner
      if (settings.trialStay?.enabled) {
        showTrialStayBanner(settings.trialStay);
      }
      
      // Handle Room Prices and Availability
      if (settings.rooms) {
        updateRoomCards(settings.rooms);
      }
      
      // Handle Weekly Menu
      if (settings.weeklyMenu) {
        initWeeklyMenu(settings.weeklyMenu);
      }
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
  }
}

// Weekly Menu Functionality
let weeklyMenuData = null;

function initWeeklyMenu(menuData) {
  weeklyMenuData = menuData;
  
  // Get current day and show it by default
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  
  // Setup tab click handlers
  const tabs = document.querySelectorAll('.menu-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      // Add active to clicked tab
      tab.classList.add('active');
      // Show menu for that day
      const day = tab.dataset.day;
      showDayMenu(day);
    });
    
    // Set today's tab as active
    if (tab.dataset.day === today) {
      tab.classList.add('active');
    } else if (today === 'sunday' && tab.dataset.day === 'monday') {
      // Default to monday if today not in tabs
    }
  });
  
  // Show menu for today (or monday)
  const dayToShow = weeklyMenuData[today] ? today : 'monday';
  showDayMenu(dayToShow);
  
  // Highlight today's tab
  const todayTab = document.querySelector(`.menu-tab[data-day="${dayToShow}"]`);
  if (todayTab) {
    document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
    todayTab.classList.add('active');
  }
}

function showDayMenu(day) {
  if (!weeklyMenuData || !weeklyMenuData[day]) return;
  
  const dayMenu = weeklyMenuData[day];
  
  document.getElementById('menuBreakfast').textContent = dayMenu.breakfast || 'Not set';
  document.getElementById('menuLunch').textContent = dayMenu.lunch || 'Not set';
  document.getElementById('menuDinner').textContent = dayMenu.dinner || 'Not set';
  
  // Show/hide special badge
  const specialBadge = document.getElementById('menuSpecialBadge');
  if (specialBadge) {
    specialBadge.style.display = dayMenu.special ? 'block' : 'none';
  }
}

// Update room cards with dynamic prices and availability
function updateRoomCards(rooms) {
  const roomCards = document.querySelectorAll('.room-card-v2[data-room-type]');
  
  roomCards.forEach(card => {
    const roomType = card.dataset.roomType;
    const roomData = rooms[roomType];
    
    if (roomData) {
      // Update price
      const priceEl = card.querySelector('[data-room-price]');
      if (priceEl) {
        priceEl.innerHTML = `₹${roomData.price.toLocaleString('en-IN')}<span>/month</span>`;
      }
      
      // Update availability
      const availEl = card.querySelector('[data-room-availability]');
      if (availEl) {
        if (roomData.available) {
          availEl.className = 'available';
          availEl.innerHTML = '<i class="fa-solid fa-check-circle"></i> Available';
        } else {
          availEl.className = 'not-available';
          availEl.innerHTML = '<i class="fa-solid fa-times-circle"></i> Not Available';
        }
      }
    }
  });
}

function showTrialStayBanner(trialStay) {
  const banner = document.getElementById('trialStayBanner');
  const titleEl = document.getElementById('trialStayTitleDisplay');
  const descEl = document.getElementById('trialStayDescDisplay');
  const priceEl = document.getElementById('trialStayPriceDisplay');
  
  if (banner) {
    // Update content
    if (titleEl && trialStay.title) titleEl.textContent = trialStay.title;
    if (descEl && trialStay.description) descEl.textContent = trialStay.description;
    if (priceEl && trialStay.price) priceEl.textContent = trialStay.price;
    
    // Show banner with animation
    banner.style.display = 'block';
    banner.style.animation = 'fadeInDown 0.5s ease';
  }
  
  // Update desktop sticky button to show Trial Stay
  const stickyBtn = document.getElementById('stickyBookingBtn');
  if (stickyBtn) {
    stickyBtn.href = '/room.html?type=single&trial=true';
    stickyBtn.innerHTML = `<i class="fa-solid fa-star"></i><span>Trial Stay ₹${trialStay.price}/night</span>`;
  }
  
  // Update mobile sticky bar - change Book Room to Trial Stay
  const mobilePrimaryBtn = document.querySelector('.mobile-sticky-item.primary');
  if (mobilePrimaryBtn) {
    mobilePrimaryBtn.href = '/room.html?type=single&trial=true';
    mobilePrimaryBtn.innerHTML = `<i class="fa-solid fa-star"></i><span>Trial ₹${trialStay.price}</span>`;
  }
}

// Add fadeInDown animation if not exists
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);

// =========================================
// Trial Stay Modal Functions
// =========================================

function openTrialStayModal() {
  const overlay = document.getElementById('trialStayModalOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Set minimum date for arrival to tomorrow
    const arrivalInput = document.getElementById('trialArrivalDate');
    if (arrivalInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      arrivalInput.min = tomorrow.toISOString().split('T')[0];
      arrivalInput.value = tomorrow.toISOString().split('T')[0];
    }
  }
}

function closeTrialStayModal() {
  const overlay = document.getElementById('trialStayModalOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.id === 'trialStayModalOverlay') {
    closeTrialStayModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeTrialStayModal();
  }
});

// Trial Stay Form Submission
const trialStayForm = document.getElementById('trialStayForm');
if (trialStayForm) {
  trialStayForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(trialStayForm);
    const submitBtn = trialStayForm.querySelector('.trial-form-submit');
    const originalText = submitBtn.innerHTML;
    
    try {
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
      submitBtn.disabled = true;
      
      const queryData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        course: formData.get('course'),
        pickupLocation: formData.get('pickupLocation'),
        message: formData.get('message') || '',
        arrivalDate: formData.get('arrivalDate'),
        numberOfGuests: formData.get('numberOfGuests'),
        stayDuration: formData.get('stayDuration'),
        isTrialStay: true
      };
      
      const response = await fetch('/api/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryData)
      });
      
      if (response.ok) {
        // Show success
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Request Submitted!';
        submitBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        
        setTimeout(() => {
          closeTrialStayModal();
          trialStayForm.reset();
          submitBtn.innerHTML = originalText;
          submitBtn.style.background = '';
          submitBtn.disabled = false;
          
          // Show success notification
          alert('Thank you! Your trial stay request has been submitted. We will call you within 2 hours to confirm.');
        }, 1500);
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting trial stay form:', error);
      submitBtn.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> Try Again';
      submitBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      
      setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.style.background = '';
        submitBtn.disabled = false;
      }, 2000);
    }
  });
}

// =========================================
// Room Card Carousel Functions
// =========================================

function slideRoom(btn, direction) {
  // Prevent the click from bubbling to the card link
  event.preventDefault();
  event.stopPropagation();
  
  const carousel = btn.closest('.room-carousel');
  const images = carousel.querySelectorAll('.carousel-images img');
  const dots = carousel.querySelectorAll('.carousel-dots .dot');
  
  // Find current active image
  let activeIndex = 0;
  images.forEach((img, i) => {
    if (img.classList.contains('active')) activeIndex = i;
  });
  
  // Calculate new index
  let newIndex = activeIndex + direction;
  if (newIndex >= images.length) newIndex = 0;
  if (newIndex < 0) newIndex = images.length - 1;
  
  // Update active states
  images.forEach(img => img.classList.remove('active'));
  dots.forEach(dot => dot.classList.remove('active'));
  
  images[newIndex].classList.add('active');
  dots[newIndex].classList.add('active');
  
  // Reset auto-slide timer for this carousel
  resetCarouselTimer(carousel);
}

// Store timers for each carousel
const carouselTimers = new Map();

function resetCarouselTimer(carousel) {
  const roomType = carousel.dataset.room;
  if (carouselTimers.has(roomType)) {
    clearInterval(carouselTimers.get(roomType));
  }
  startCarouselAutoSlide(carousel);
}

function startCarouselAutoSlide(carousel) {
  const roomType = carousel.dataset.room;
  const timer = setInterval(() => {
    const images = carousel.querySelectorAll('.carousel-images img');
    const dots = carousel.querySelectorAll('.carousel-dots .dot');
    
    let activeIndex = 0;
    images.forEach((img, i) => {
      if (img.classList.contains('active')) activeIndex = i;
    });
    
    let newIndex = (activeIndex + 1) % images.length;
    
    images.forEach(img => img.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    images[newIndex].classList.add('active');
    dots[newIndex].classList.add('active');
  }, 3000); // Auto-slide every 3 seconds
  
  carouselTimers.set(roomType, timer);
}

// Initialize carousel functionality
document.addEventListener('DOMContentLoaded', () => {
  // Start auto-slide for all room carousels
  document.querySelectorAll('.room-carousel').forEach(carousel => {
    startCarouselAutoSlide(carousel);
  });
  
  // Add click handlers for carousel dots
  document.querySelectorAll('.room-carousel .carousel-dots .dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const carousel = dot.closest('.room-carousel');
      const images = carousel.querySelectorAll('.carousel-images img');
      const allDots = carousel.querySelectorAll('.carousel-dots .dot');
      
      // Find index of clicked dot
      let clickedIndex = 0;
      allDots.forEach((d, i) => {
        if (d === dot) clickedIndex = i;
      });
      
      // Update active states
      images.forEach(img => img.classList.remove('active'));
      allDots.forEach(d => d.classList.remove('active'));
      
      images[clickedIndex].classList.add('active');
      dot.classList.add('active');
      
      // Reset auto-slide timer
      resetCarouselTimer(carousel);
    });
  });
  
  // Prevent carousel buttons from navigating to room page
  document.querySelectorAll('.room-carousel .carousel-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
});

// ==========================================
// Explore Our Hostel & Lightbox Logic
// ==========================================

async function loadGalleryContent() {
    try {
        const response = await fetch('/api/settings');
        if (!response.ok) return;
        const data = await response.json();

        // 1. Premium Rooms
        const roomImages = [];
        const roomTypes = ['single', 'single_balcony', 'double', 'double_balcony'];
        
        if (data.rooms) {
            roomTypes.forEach(type => {
                const room = data.rooms[type];
                if (room && room.images && room.images.length > 0) {
                    room.images.forEach(img => {
                        roomImages.push({
                            src: img,
                            title: room.name,
                            caption: room.description
                        });
                    });
                }
            });
        }
        renderGalleryGrid('gallery-rooms', roomImages);

        // 2. Hostel Amenities
        const amenitiesImages = (data.amenitiesImages || []).map(img => ({
            src: img,
            title: 'Hostel Amenities',
            caption: 'Premium facilities for students'
        }));
        renderGalleryGrid('gallery-amenities', amenitiesImages);

        // 3. Hostel Campus
        const campusImages = (data.campusImages || []).map(img => ({
            src: img,
            title: 'Hostel Campus',
            caption: 'Campus Environment'
        }));
        renderGalleryGrid('gallery-campus', campusImages);

    } catch (error) {
        console.error('Error loading gallery content:', error);
    }
}

function renderGalleryGrid(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center;">No images available in this section.</p>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="gallery-item" onclick="openGalleryLightbox('${item.src}', '${item.title}')">
            <img src="${item.src}" alt="${item.title}">
            <div class="gallery-overlay">
                <div class="gallery-text">
                    <h4>${item.title}</h4>
                    <p>${item.caption || ''}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Lightbox Functions
function openGalleryLightbox(src, caption) {
    const modal = document.getElementById("galleryLightbox");
    const modalImg = document.getElementById("lightboxImage");
    const captionText = document.getElementById("lightboxCaption");
    
    modal.style.display = "block";
    modalImg.src = src;
    captionText.innerHTML = `<h3>${caption}</h3>`;
    
    // Lock body scroll
    document.body.style.overflow = "hidden";
}

function closeGalleryLightbox() {
    const modal = document.getElementById("galleryLightbox");
    modal.style.display = "none";
    document.body.style.overflow = "auto";
}

// Close lightbox on outside click
window.onclick = function(event) {
    const modal = document.getElementById("galleryLightbox");
    if (event.target == modal) {
        closeGalleryLightbox();
    }
}

// Load gallery on page load
document.addEventListener('DOMContentLoaded', () => {
    loadGalleryContent();
    loadRoomCards();
});

// ==========================================
// Dynamic Room Cards Logic
// ==========================================
async function loadRoomCards() {
    const container = document.getElementById('rooms-grid-dynamic');
    if (!container) return;

    try {
        const response = await fetch('/api/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        
        const data = await response.json();
        // API returns object directly, not wrapped in 'settings'
        const rooms = data.rooms;
        if (!rooms) {
            throw new Error('Rooms data missing from API response');
        }
        const roomOrder = ['single', 'single_balcony', 'double', 'double_balcony'];

        const cardsHtml = roomOrder.map(type => {
            const room = rooms[type];
            if (!room) return '';
            
            // Skip rooms that are disabled hidden from website
            if (room.enabled === false) return '';

            // Handle images
            let imagesHtml = '';
            let dotsHtml = '';
            
            if (room.images && room.images.length > 0) {
                imagesHtml = room.images.map((img, index) => 
                    `<img src="/${img.startsWith('/') ? img.substring(1) : img}" alt="${room.name}" class="${index === 0 ? 'active' : ''}">`
                ).join('');
                
                dotsHtml = room.images.map((_, index) => 
                    `<span class="dot ${index === 0 ? 'active' : ''}"></span>`
                ).join('');
            } else {
                // Fallback
                imagesHtml = '<img src="assets/room-1.png" alt="Room Placeholder" class="active">';
                dotsHtml = '<span class="dot active"></span>';
            }

            const availabilityHtml = room.available 
                ? '<span class="available" data-room-availability><i class="fa-solid fa-check-circle"></i> Available</span>'
                : '<span class="unavailable" style="color: #dc2626; background: rgba(220, 38, 38, 0.1); padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; display: flex; align-items: center; gap: 5px;"><i class="fa-solid fa-times-circle"></i> Sold Out</span>';

            // Static meta data mapping (could be moved to DB later)
            const meta = {
                single: { size: '120 sq.ft', capacity: '1 Person', amenities: ['Bed', 'AC', 'Bath', 'Desk', 'WiFi'] },
                single_balcony: { size: '140 sq.ft', capacity: '1 Person', amenities: ['Bed', 'AC', 'Balcony', 'Bath', 'WiFi'] },
                double: { size: '180 sq.ft', capacity: '2 People', amenities: ['2 Beds', 'AC', 'Bath', '2 Desks', 'WiFi'] },
                double_balcony: { size: '200 sq.ft', capacity: '2 People', amenities: ['2 Beds', 'AC', 'Balcony', 'Bath', 'WiFi'] }
            }[type] || { size: 'N/A', capacity: 'N/A', amenities: [] };

            // Badge for balcony
            const badgeHtml = type.includes('balcony') ? '<span class="room-badge-v2">Balcony</span>' : '';

            // Amenities HTML
            const amenitiesIcons = {
                'Bed': 'fa-bed', '2 Beds': 'fa-bed',
                'AC': 'fa-snowflake', 
                'Bath': 'fa-shower', 
                'Desk': 'fa-chair', '2 Desks': 'fa-chair',
                'WiFi': 'fa-wifi',
                'Balcony': 'fa-door-open'
            };

            const amenitiesList = meta.amenities.map(item => 
                `<span><i class="fa-solid ${amenitiesIcons[item] || 'fa-check'}"></i> ${item}</span>`
            ).join('');

            return `
                <a href="/room.html?type=${type}" class="room-card-v2" data-room-type="${type}">
                    <div class="room-carousel" data-room="${type}">
                        ${badgeHtml}
                        <div class="carousel-images">
                            ${imagesHtml}
                        </div>
                        <div class="carousel-dots">
                            ${dotsHtml}
                        </div>
                    </div>
                    <div class="room-content-v2">
                        <div class="room-header-v2">
                            <h3>${room.name}</h3>
                            <div class="room-price-v2">₹${room.price.toLocaleString()}<span>/month</span></div>
                        </div>
                        <div class="room-meta-v2">
                            <span><i class="fa-solid fa-ruler-combined"></i> ${meta.size}</span>
                            <span><i class="fa-solid fa-user${meta.capacity.includes('2') ? '-group' : ''}"></i> ${meta.capacity}</span>
                            ${availabilityHtml}
                        </div>
                        <div class="room-amenities-v2">
                            ${amenitiesList}
                        </div>
                        <p class="room-desc-v2">${room.description}</p>
                        <span class="room-btn-v2">View & Book <i class="fa-solid fa-arrow-right"></i></span>
                    </div>
                </a>
            `;
        }).join('');

        container.innerHTML = cardsHtml;

        // Check if all rooms are sold out
        const enabledRooms = roomOrder.filter(type => rooms[type] && rooms[type].enabled !== false);
        const allSoldOut = enabledRooms.length > 0 && enabledRooms.every(type => rooms[type].available === false);
        
        // Remove existing sold out banner if any
        const existingBanner = document.getElementById('all-rooms-sold-out-banner');
        if (existingBanner) existingBanner.remove();
        
        // Add sold out banner if all rooms are unavailable
        if (allSoldOut) {
            const soldOutBanner = document.createElement('div');
            soldOutBanner.id = 'all-rooms-sold-out-banner';
            soldOutBanner.className = 'sold-out-banner';
            soldOutBanner.innerHTML = `
                <div class="sold-out-banner-content">
                    <div class="sold-out-icon">
                        <i class="fa-solid fa-house-circle-exclamation"></i>
                    </div>
                    <div class="sold-out-text">
                        <h3>All Rooms Currently Occupied</h3>
                        <p>We're thrilled by the demand! All our rooms are fully booked at the moment. Leave your contact details below and we'll notify you as soon as a room becomes available.</p>
                    </div>
                    <a href="#contact" class="sold-out-btn">
                        <i class="fa-solid fa-bell"></i> Get Notified
                    </a>
                </div>
            `;
            container.parentNode.insertBefore(soldOutBanner, container.nextSibling);
        }

        // Initialize carousels after dynamic render
        document.querySelectorAll('.room-carousel').forEach(carousel => {
            // Remove existing timers if any
            if (carouselTimers.has(carousel.dataset.room)) {
                clearInterval(carouselTimers.get(carousel.dataset.room));
                carouselTimers.delete(carousel.dataset.room);
            }
            startCarouselAutoSlide(carousel);
            
            // Re-bind click events for dots
            carousel.querySelectorAll('.carousel-dots .dot').forEach((dot, idx) => {
                dot.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const images = carousel.querySelectorAll('.carousel-images img');
                    const dots = carousel.querySelectorAll('.carousel-dots .dot');
                    
                    images.forEach(img => img.classList.remove('active'));
                    dots.forEach(d => d.classList.remove('active'));
                    
                    images[idx].classList.add('active');
                    dots[idx].classList.add('active');
                    
                    resetCarouselTimer(carousel);
                };
            });
        });

    } catch (error) {
        console.error('Error loading rooms:', error);
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #dc2626;">Failed to load room rates. Please try again later.</p>';
    }
}

// ==========================================
// Dynamic Staff Section Logic
// ==========================================
async function loadStaffSection() {
    const container = document.getElementById('staff-grid-dynamic');
    if (!container) return;

    try {
        const response = await fetch('/api/staff');
        if (!response.ok) throw new Error('Failed to fetch staff');
        
        const staff = await response.json();
        
        if (staff.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;">Our team information will be updated soon.</p>';
            return;
        }

        container.innerHTML = staff.map((member, index) => `
            <div class="staff-card animate-fade-up ${index > 0 ? 'delay-' + Math.min(index, 3) : ''}">
                <div class="staff-img-box">
                    ${member.image 
                        ? `<img src="/${member.image}" alt="${member.name}" class="staff-img">`
                        : `<div class="staff-img" style="background: linear-gradient(135deg, #1a1a2e, #16213e); display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-user" style="font-size: 3rem; color: #d4af37;"></i></div>`
                    }
                    <div class="staff-badge"><i class="fa-solid ${member.icon || 'fa-user-tie'}"></i></div>
                </div>
                <div class="staff-info">
                    <h3>${member.name}</h3>
                    <span class="staff-role">${member.role.toUpperCase()}</span>
                    <p>${member.description || ''}</p>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading staff:', error);
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1/-1;">Unable to load team information.</p>';
    }
}

// Load staff section on page load
document.addEventListener('DOMContentLoaded', loadStaffSection);

// ==========================================
// Amazon-Style Gallery Thumbnail Switching
// ==========================================
function switchMainImage(galleryId, thumbElement) {
    // Get the main image for this gallery
    const mainImage = document.getElementById(`${galleryId}-main`);
    if (!mainImage) return;
    
    // Update main image source
    mainImage.src = thumbElement.src;
    mainImage.alt = thumbElement.alt;
    
    // Update active state on thumbnails
    const gallery = thumbElement.closest('.amazon-gallery');
    if (gallery) {
        gallery.querySelectorAll('.gallery-thumb').forEach(thumb => {
            thumb.classList.remove('active');
        });
        thumbElement.classList.add('active');
    }
}

// Open lightbox on main image click
document.querySelectorAll('.main-image-container').forEach(container => {
    container.addEventListener('click', function() {
        const img = this.querySelector('.main-gallery-image');
        if (img && typeof openGalleryLightbox === 'function') {
            openGalleryLightbox(img.src, img.alt);
        }
    });
});

// ==========================================
// Contact Form Submission Handler
// ==========================================
document.getElementById('contactForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('contactSubmitBtn');
    const originalText = submitBtn.innerHTML;
    
    // Get form values
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const course = document.getElementById('contactCourse').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    
    // Validation
    if (!name || !email || !phone || !message) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
    
    try {
        const response = await fetch('/api/queries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                phone,
                message: course ? `Exam Target: ${course}\n\n${message}` : message,
                isTrialStay: false
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Message sent successfully! We will contact you soon.', 'success');
            this.reset();
        } else {
            showNotification(data.message || 'Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        showNotification('Connection error. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// Simple notification function for contact form
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.form-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `form-notification ${type}`;
    notification.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        notification.style.transition = '0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}
