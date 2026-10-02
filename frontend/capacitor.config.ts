import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.veltrion.app",
  appName: "VELTRION",
  webDir: "dist",
  android: {
    allowMixedContent: false
  }
};

export default config;
