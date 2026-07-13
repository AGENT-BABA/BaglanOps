/**
 * Router Auto-Detection (Browser-Side)
 * Attempts to detect the client's router by probing common gateway IPs.
 */

const COMMON_GATEWAYS = [
  { ip: "192.168.0.1", brands: ["tplink", "dlink", "tenda"] },
  { ip: "192.168.1.1", brands: ["netgear", "asus", "cisco"] },
  { ip: "192.168.31.1", brands: ["xiaomi"] },
  { ip: "192.168.100.1", brands: ["motorola", "arris"] },
  { ip: "192.168.8.1", brands: ["huawei"] },
  { ip: "10.0.0.1", brands: ["other"] },
];

const BRAND_FINGERPRINTS = {
  tplink: ["/logos/tplink_logo.png", "/images/logo.png", "tplinkwifi.net"],
  netgear: ["/images/logo_login.gif", "routerlogin.net"],
  dlink: ["/assets/images/logo.png", "dlinkrouter.local"],
  asus: ["/require/modules/login.css", "router.asus.com"],
  xiaomi: ["/luci-static/", "miwifi.com"],
  huawei: ["/html/ssmp/icon/", "192.168.8.1"],
};

/**
 * Try to detect the router by probing common gateway IPs.
 * Returns { detected: boolean, ip: string|null, brand: string|null }
 */
export async function detectRouter(attempt = 0) {
  // Try the gateway IP from WebRTC first
  const localIP = await getLocalIP();
  if (localIP) {
    const gateway = inferGateway(localIP);
    if (gateway) {
      const result = await probeGateway(gateway);
      if (result.detected) return result;
    }
  }

  // Scan common gateways (skip ones already tried)
  const startIdx = attempt % COMMON_GATEWAYS.length;
  for (let i = 0; i < COMMON_GATEWAYS.length; i++) {
    const idx = (startIdx + i) % COMMON_GATEWAYS.length;
    const gw = COMMON_GATEWAYS[idx];
    const result = await probeGateway(gw.ip);
    if (result.detected) {
      return { ...result, brand: result.brand || "other" };
    }
  }

  return { detected: false, ip: null, brand: null };
}

/**
 * Get local IP via WebRTC.
 */
async function getLocalIP() {
  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel("");
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        pc.close();
        resolve(null);
      }, 2000);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate;
          const match = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
          if (match && !match[1].startsWith("0.") && !match[1].startsWith("127.")) {
            clearTimeout(timeout);
            pc.close();
            resolve(match[1]);
          }
        }
      };
    });
  } catch {
    return null;
  }
}

/**
 * Infer gateway IP from local IP (assume .1 on same subnet).
 */
function inferGateway(localIP) {
  if (!localIP) return null;
  const parts = localIP.split(".");
  if (parts.length !== 4) return null;
  parts[3] = "1";
  return parts.join(".");
}

/**
 * Probe a specific gateway IP to see if a router responds.
 */
async function probeGateway(ip) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`http://${ip}/`, {
      mode: "no-cors",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // In no-cors mode, we get a response even if CORS blocks it
    // The fact that we got here means something responded
    const brand = await fingerprintBrand(ip);
    return { detected: true, ip, brand };
  } catch {
    return { detected: false, ip: null, brand: null };
  }
}

/**
 * Try to identify the router brand by loading known resources.
 */
async function fingerprintBrand(ip) {
  for (const [brand, paths] of Object.entries(BRAND_FINGERPRINTS)) {
    for (const path of paths) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        if (path.startsWith("http") || path.includes(".")) {
          // It's a domain or file path — try loading as image/style
          const img = new Image();
          img.src = `http://${ip}${path.startsWith("/") ? path : "/" + path}`;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            setTimeout(reject, 1500);
          });
          clearTimeout(timeoutId);
          return brand;
        }
      } catch {
        // This fingerprint didn't match, try next
      }
    }
  }
  return null;
}
