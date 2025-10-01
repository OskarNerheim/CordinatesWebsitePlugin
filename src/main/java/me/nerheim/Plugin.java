package me.nerheim;

import java.util.logging.Logger;
import java.net.InetSocketAddress;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerMoveEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.entity.Player;
import org.bukkit.Location;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

/*
 * coordinatewebsite java plugin
 */
public class Plugin extends JavaPlugin implements Listener
{
    private static final Logger LOGGER = Logger.getLogger("coordinatewebsite");
    private CoordinateWebSocketServer webSocketServer;
    private final int WEBSOCKET_PORT = 8080;

    public void onEnable()
    {
        getLogger().info("coordinatewebsite enabled");
        
        // Register event listener
        getServer().getPluginManager().registerEvents(this, this);
        
        // Start WebSocket server
        startWebSocketServer();
    }

    public void onDisable()
    {
        getLogger().info("coordinatewebsite disabled");
        
        // Stop WebSocket server
        if (webSocketServer != null) {
            try {
                webSocketServer.stop();
                getLogger().info("WebSocket server stopped");
            } catch (Exception e) {
                getLogger().severe("Error stopping WebSocket server: " + e.getMessage());
            }
        }
    }

    private void startWebSocketServer() {
        try {
            webSocketServer = new CoordinateWebSocketServer(new InetSocketAddress(WEBSOCKET_PORT));
            webSocketServer.start();
            getLogger().info("WebSocket server started on port " + WEBSOCKET_PORT);
        } catch (Exception e) {
            getLogger().severe("Failed to start WebSocket server: " + e.getMessage());
        }
    }

    @EventHandler
    public void onPlayerMove(PlayerMoveEvent event)
    {
        Player player = event.getPlayer();
        Location loc = player.getLocation();
        double x = Math.round(loc.getX() * 100.0) / 100.0; // Round to 2 decimal places
        double y = Math.round(loc.getY() * 100.0) / 100.0;
        double z = Math.round(loc.getZ() * 100.0) / 100.0;
        String world = loc.getWorld().getName();
        
        // Send coordinates to WebSocket clients
        if (webSocketServer != null) {
            String coordinateData = String.format(
                "{\"type\":\"coordinates\",\"player\":\"%s\",\"x\":%.2f,\"y\":%.2f,\"z\":%.2f,\"world\":\"%s\"}", 
                player.getName(), x, y, z, world
            );
            webSocketServer.broadcast(coordinateData);
        }
        
        // Optional: Log less frequently to avoid spam
        // getLogger().info(player.getName() + " moved to " + x + ", " + y + ", " + z + " in world " + world);
    }

    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        getLogger().info(player.getName() + " joined the server");
        
        // Send player join notification to WebSocket clients
        if (webSocketServer != null) {
            String joinData = String.format(
                "{\"type\":\"playerJoin\",\"player\":\"%s\"}", 
                player.getName()
            );
            webSocketServer.broadcast(joinData);
            
            // Also send current player list
            sendPlayerList();
        }
    }

    @EventHandler
    public void onPlayerQuit(PlayerQuitEvent event) {
        Player player = event.getPlayer();
        getLogger().info(player.getName() + " left the server");
        
        // Send player leave notification to WebSocket clients
        if (webSocketServer != null) {
            String leaveData = String.format(
                "{\"type\":\"playerLeave\",\"player\":\"%s\"}", 
                player.getName()
            );
            webSocketServer.broadcast(leaveData);
        }
    }

    private void sendPlayerList() {
        if (webSocketServer != null) {
            StringBuilder playerList = new StringBuilder();
            playerList.append("{\"type\":\"playerList\",\"players\":[");
            
            Player[] players = getServer().getOnlinePlayers().toArray(new Player[0]);
            for (int i = 0; i < players.length; i++) {
                playerList.append("\"").append(players[i].getName()).append("\"");
                if (i < players.length - 1) {
                    playerList.append(",");
                }
            }
            
            playerList.append("]}");
            webSocketServer.broadcast(playerList.toString());
        }
    }

    // Inner class for WebSocket server
    private class CoordinateWebSocketServer extends WebSocketServer {
        private Set<WebSocket> connections = new CopyOnWriteArraySet<>();

        public CoordinateWebSocketServer(InetSocketAddress address) {
            super(address);
        }

        @Override
        public void onOpen(WebSocket conn, ClientHandshake handshake) {
            connections.add(conn);
            getLogger().info("New WebSocket connection: " + conn.getRemoteSocketAddress());
            
            // Send welcome message
            conn.send("{\"type\":\"connected\",\"message\":\"Connected to Minecraft coordinate tracker\"}");
            
            // Send current player list to new connection
            sendPlayerList();
        }

        @Override
        public void onClose(WebSocket conn, int code, String reason, boolean remote) {
            connections.remove(conn);
            getLogger().info("WebSocket connection closed: " + conn.getRemoteSocketAddress());
        }

        @Override
        public void onMessage(WebSocket conn, String message) {
            getLogger().info("Received WebSocket message: " + message);
            // Handle incoming messages from website if needed
        }

        @Override
        public void onError(WebSocket conn, Exception ex) {
            getLogger().severe("WebSocket error: " + ex.getMessage());
            if (conn != null) {
                connections.remove(conn);
            }
        }

        @Override
        public void onStart() {
            getLogger().info("WebSocket server started successfully");
        }

        public void broadcast(String message) {
            for (WebSocket conn : connections) {
                if (conn.isOpen()) {
                    conn.send(message);
                }
            }
        }
    }
}


