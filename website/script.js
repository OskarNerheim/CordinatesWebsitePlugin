// Sample coordinates data
let currentCoordinates = {
    x: 0,
    y: 0,
    z: 0
};

let savedLocations = [];

// WebSocket connection
let websocket = null;
let connectionStatus = 'disconnected';
let currentPlayer = null;
let currentWorld = null;

// Multiple players tracking
let onlinePlayers = new Map(); // playerName -> {x, y, z, world, lastUpdate}
let selectedPlayer = null;

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

// WebSocket connection functions
function connectToMinecraft() {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        console.log('Already connected to Minecraft server');
        return;
    }

    try {
        websocket = new WebSocket('ws://localhost:8080');
        
        websocket.onopen = function(event) {
            console.log('Connected to Minecraft server');
            connectionStatus = 'connected';
            updateConnectionStatus();
        };
        
        websocket.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                handleMinecraftMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        websocket.onclose = function(event) {
            console.log('Disconnected from Minecraft server');
            connectionStatus = 'disconnected';
            updateConnectionStatus();
            
            // Try to reconnect after 5 seconds
            setTimeout(() => {
                if (connectionStatus === 'disconnected') {
                    connectToMinecraft();
                }
            }, 5000);
        };
        
        websocket.onerror = function(error) {
            console.error('WebSocket error:', error);
            connectionStatus = 'error';
            updateConnectionStatus();
        };
        
    } catch (error) {
        console.error('Failed to connect to Minecraft server:', error);
        connectionStatus = 'error';
        updateConnectionStatus();
    }
}

function handleMinecraftMessage(data) {
    switch (data.type) {
        case 'connected':
            console.log('Minecraft plugin connection established');
            break;
            
        case 'coordinates':
            // Update player data
            const playerData = {
                x: Math.round(data.x * 100) / 100,
                y: Math.round(data.y * 100) / 100,
                z: Math.round(data.z * 100) / 100,
                world: data.world,
                lastUpdate: new Date()
            };
            
            onlinePlayers.set(data.player, playerData);
            
            // If this is the selected player or no player is selected, update display
            if (!selectedPlayer || selectedPlayer === data.player) {
                selectedPlayer = data.player;
                currentCoordinates.x = playerData.x;
                currentCoordinates.y = playerData.y;
                currentCoordinates.z = playerData.z;
                currentPlayer = data.player;
                currentWorld = data.world;
                updateCoordinateDisplay();
            }
            
            // Update player list
            updatePlayerList();
            break;
            
        case 'playerJoin':
            console.log(`Player ${data.player} joined the server`);
            updatePlayerList();
            break;
            
        case 'playerLeave':
            console.log(`Player ${data.player} left the server`);
            onlinePlayers.delete(data.player);
            if (selectedPlayer === data.player) {
                // Switch to another player or clear selection
                const remainingPlayers = Array.from(onlinePlayers.keys());
                if (remainingPlayers.length > 0) {
                    selectPlayer(remainingPlayers[0]);
                } else {
                    selectedPlayer = null;
                    currentPlayer = null;
                }
            }
            updatePlayerList();
            break;
            
        case 'playerList':
            // Handle initial player list or full update
            if (data.players) {
                data.players.forEach(player => {
                    if (!onlinePlayers.has(player)) {
                        onlinePlayers.set(player, {
                            x: 0, y: 0, z: 0,
                            world: 'unknown',
                            lastUpdate: new Date()
                        });
                    }
                });
            }
            updatePlayerList();
            break;
            
        default:
            console.log('Unknown message type:', data.type);
    }
}

function updateCoordinateDisplay() {
    document.getElementById('coord-x').textContent = currentCoordinates.x;
    document.getElementById('coord-y').textContent = currentCoordinates.y;
    document.getElementById('coord-z').textContent = currentCoordinates.z;
    
    // Update player and world info if available
    const playerInfo = document.getElementById('player-info');
    if (playerInfo && currentPlayer) {
        playerInfo.textContent = `Player: ${currentPlayer} | World: ${currentWorld}`;
    }
    
    // Add visual feedback
    const coordDisplay = document.querySelector('.coord-display');
    if (coordDisplay) {
        coordDisplay.style.backgroundColor = '#27ae60';
        setTimeout(() => {
            coordDisplay.style.backgroundColor = '#2c3e50';
        }, 300);
    }
}

function updatePlayerList() {
    const playerListContainer = document.getElementById('player-list');
    if (!playerListContainer) return;
    
    const players = Array.from(onlinePlayers.keys());
    
    if (players.length === 0) {
        playerListContainer.innerHTML = '<p class="no-players">No players online</p>';
        return;
    }
    
    let html = '<div class="players-grid">';
    players.forEach(playerName => {
        const playerData = onlinePlayers.get(playerName);
        const isSelected = selectedPlayer === playerName;
        const timeSinceUpdate = Math.floor((new Date() - playerData.lastUpdate) / 1000);
        
        html += `
            <div class="player-card ${isSelected ? 'selected' : ''}" onclick="selectPlayer('${playerName}')">
                <div class="player-name">${playerName}</div>
                <div class="player-coords">
                    <span>X: ${playerData.x}</span>
                    <span>Y: ${playerData.y}</span>
                    <span>Z: ${playerData.z}</span>
                </div>
                <div class="player-world">World: ${playerData.world}</div>
                <div class="player-update">Updated: ${timeSinceUpdate}s ago</div>
            </div>
        `;
    });
    html += '</div>';
    
    playerListContainer.innerHTML = html;
}

function selectPlayer(playerName) {
    if (!onlinePlayers.has(playerName)) return;
    
    selectedPlayer = playerName;
    const playerData = onlinePlayers.get(playerName);
    
    // Update current coordinates display
    currentCoordinates.x = playerData.x;
    currentCoordinates.y = playerData.y;
    currentCoordinates.z = playerData.z;
    currentPlayer = playerName;
    currentWorld = playerData.world;
    
    updateCoordinateDisplay();
    updatePlayerList(); // Update to show new selection
}

function updateConnectionStatus() {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        statusElement.textContent = connectionStatus;
        statusElement.className = `connection-status ${connectionStatus}`;
    }
}

function disconnectFromMinecraft() {
    if (websocket) {
        websocket.close();
        websocket = null;
        connectionStatus = 'disconnected';
        updateConnectionStatus();
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
    
    // Connect to Minecraft server
    connectToMinecraft();
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