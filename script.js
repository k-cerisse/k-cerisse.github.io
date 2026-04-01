/* 1. INTERACTIVE ICONS LOGIC (Click to Reveal) */

function toggleReveal(targetId) {
    // Find the content to reveal by ID
    const targetContent = document.getElementById(targetId);
    
    // Toggle the .hidden class
    if (targetContent) {
        if (targetContent.classList.contains('hidden')) {
            targetContent.classList.remove('hidden');
        } else {
            targetContent.classList.add('hidden');
        }
    }
}


/* 2. SCROLLING ANIMATIONS (IntersectionObserver) */

const observerOptions = {
    root: null, // Use viewport
    rootMargin: '0px',
    threshold: 0.15 // Trigger when 15% of the section is visible
};

const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Fade in the section
            entry.target.classList.remove('hidden-section');
            entry.target.classList.add('visible-section');
            
            // Trigger the side icon animation to pop out
            const icon = entry.target.querySelector('.scroll-icon');
            if(icon) {
                icon.classList.add('show-icon');
            }
        }
    });
}, observerOptions);

// Attach observer to all rubric sections on load
document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll('.rubric-section');
    sections.forEach(section => {
        sectionObserver.observe(section);
    });
});
