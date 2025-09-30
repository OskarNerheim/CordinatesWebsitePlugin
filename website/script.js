// Sample coordinates data
let currentCoordinates = {
    x: 0,
    y: 64,
    z: 0
};

let savedLocations = [];

// Function to scroll to a specific section
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// Function to update coordinates (simulate getting data from Minecraft plugin)
function updateCoordinates() {
    // In a real implementation, this would fetch data from your Minecraft plugin
    // For now, we'll simulate with random coordinates
    currentCoordinates.x = Math.floor(Math.random() * 2000) - 1000;
    currentCoordinates.y = Math.floor(Math.random() * 256);
    currentCoordinates.z = Math.floor(Math.random() * 2000) - 1000;
    
    // Update the display
    document.getElementById('coord-x').textContent = currentCoordinates.x;
    document.getElementById('coord-y').textContent = currentCoordinates.y;
    document.getElementById('coord-z').textContent = currentCoordinates.z;
    
    // Add a visual feedback
    const coordDisplay = document.querySelector('.coord-display');
    coordDisplay.style.backgroundColor = '#27ae60';
    setTimeout(() => {
        coordDisplay.style.backgroundColor = '#2c3e50';
    }, 500);
}

// Function to save current location
function saveCurrentLocation() {
    const locationName = prompt('Enter a name for this location:');
    if (locationName && locationName.trim()) {
        const newLocation = {
            name: locationName.trim(),
            x: currentCoordinates.x,
            y: currentCoordinates.y,
            z: currentCoordinates.z,
            timestamp: new Date().toLocaleString()
        };
        
        savedLocations.push(newLocation);
        updateSavedLocationsDisplay();
        
        // Save to localStorage for persistence
        localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
    }
}

// Function to update saved locations display
function updateSavedLocationsDisplay() {
    const container = document.getElementById('saved-locations');
    
    if (savedLocations.length === 0) {
        container.innerHTML = '<p>No saved locations yet</p>';
        return;
    }
    
    let html = '';
    savedLocations.forEach((location, index) => {
        html += `
            <div class="saved-location" style="margin-bottom: 1rem; padding: 0.5rem; background: white; border-radius: 5px;">
                <strong>${location.name}</strong><br>
                <small>X: ${location.x}, Y: ${location.y}, Z: ${location.z}</small><br>
                <small>Saved: ${location.timestamp}</small>
                <button onclick="deleteLocation(${index})" style="float: right; background: #e74c3c; color: white; border: none; padding: 2px 8px; border-radius: 3px; cursor: pointer;">Delete</button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Function to delete a saved location
function deleteLocation(index) {
    if (confirm('Are you sure you want to delete this location?')) {
        savedLocations.splice(index, 1);
        updateSavedLocationsDisplay();
        localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
    }
}

// Function to load saved locations from localStorage
function loadSavedLocations() {
    const saved = localStorage.getItem('savedLocations');
    if (saved) {
        savedLocations = JSON.parse(saved);
        updateSavedLocationsDisplay();
    }
}

// Navigation smooth scrolling for mobile
document.addEventListener('DOMContentLoaded', function() {
    // Load saved locations
    loadSavedLocations();
    
    // Add click handlers for navigation links
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
    
    // Initialize coordinates display
    document.getElementById('coord-x').textContent = currentCoordinates.x;
    document.getElementById('coord-y').textContent = currentCoordinates.y;
    document.getElementById('coord-z').textContent = currentCoordinates.z;
});

// API function to receive coordinates from Minecraft plugin
// This would be called by your Minecraft plugin
function receiveCoordinatesFromPlugin(x, y, z) {
    currentCoordinates.x = x;
    currentCoordinates.y = y;
    currentCoordinates.z = z;
    
    // Update display
    document.getElementById('coord-x').textContent = x;
    document.getElementById('coord-y').textContent = y;
    document.getElementById('coord-z').textContent = z;
}

// API function to get current coordinates (for plugin to call)
function getCurrentCoordinates() {
    return currentCoordinates;
}

// API function to get saved locations (for plugin to call)
function getSavedLocations() {
    return savedLocations;
}