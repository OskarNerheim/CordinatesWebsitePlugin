package me.nerheim;

import java.util.logging.Logger;
import org.bukkit.plugin.java.JavaPlugin;

/*
 * coordinatewebsite java plugin
 */
public class Plugin extends JavaPlugin
{
  private static final Logger LOGGER=Logger.getLogger("coordinatewebsite");

  public void onEnable()
  {
    LOGGER.info("coordinatewebsite enabled");
  }

  public void onDisable()
  {
    LOGGER.info("coordinatewebsite disabled");
  }
}
