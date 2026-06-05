#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$ROOT_DIR/mobile/native-ios"
PROJECT="$IOS_DIR/EduMindAI.xcodeproj"
SCHEME="EduMindAI"
BUNDLE_ID="com.edumindai.app"
DERIVED_DATA="$IOS_DIR/.build"

log() {
  printf '[mobile] %s\n' "$*"
}

if [[ "$(uname -s)" != "Darwin" ]]; then
  log "iOS simülatör yalnızca macOS üzerinde çalışır; atlanıyor."
  tail -f /dev/null
  exit 0
fi

if ! command -v xcodebuild >/dev/null 2>&1; then
  log "Xcode bulunamadı. App Store'dan Xcode kurun veya mobil adımı atlayın."
  tail -f /dev/null
  exit 0
fi

pick_simulator() {
  if [[ -n "${EDUMIND_SIMULATOR:-}" ]]; then
    xcrun simctl list devices available -j |
      EDUMIND_SIMULATOR="$EDUMIND_SIMULATOR" php -r '
        $target = getenv("EDUMIND_SIMULATOR");
        $data = json_decode(stream_get_contents(STDIN), true);
        foreach ($data["devices"] as $runtime => $devices) {
          if (strpos($runtime, "iOS") === false) continue;
          foreach ($devices as $device) {
            if (($device["isAvailable"] ?? false) !== true) continue;
            if ($device["name"] === $target || $device["udid"] === $target) {
              echo $device["udid"] . "|" . $device["name"];
              exit(0);
            }
          }
        }
        exit(1);
      '
    return
  fi

  xcrun simctl list devices available -j |
    php -r '
      $data = json_decode(stream_get_contents(STDIN), true);
      foreach ($data["devices"] as $runtime => $devices) {
        if (strpos($runtime, "iOS") === false) continue;
        foreach ($devices as $device) {
          if (($device["isAvailable"] ?? false) !== true) continue;
          if (str_starts_with($device["name"], "iPhone")) {
            echo $device["udid"] . "|" . $device["name"];
            exit(0);
          }
        }
      }
      exit(1);
    '
}

SIMULATOR_INFO="$(pick_simulator || true)"
if [[ -z "$SIMULATOR_INFO" ]]; then
  log "Kullanılabilir iPhone simülatörü bulunamadı."
  exit 1
fi

DEVICE_UDID="${SIMULATOR_INFO%%|*}"
SIMULATOR_NAME="${SIMULATOR_INFO#*|}"

log "Simülatör: $SIMULATOR_NAME ($DEVICE_UDID)"
log "Derleme başlıyor..."

xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -destination "platform=iOS Simulator,id=$DEVICE_UDID" \
  -derivedDataPath "$DERIVED_DATA" \
  build

APP_PATH="$DERIVED_DATA/Build/Products/Debug-iphonesimulator/EduMindAI.app"
if [[ ! -d "$APP_PATH" ]]; then
  APP_PATH="$(find "$DERIVED_DATA/Build/Products" -name '*.app' -type d | head -n 1)"
fi

if [[ -z "$APP_PATH" || ! -d "$APP_PATH" ]]; then
  log "Derlenen .app dosyası bulunamadı."
  exit 1
fi

xcrun simctl boot "$DEVICE_UDID" >/dev/null 2>&1 || true
xcrun simctl bootstatus "$DEVICE_UDID" -b >/dev/null 2>&1 || true
open -a Simulator >/dev/null 2>&1 || true

xcrun simctl install "$DEVICE_UDID" "$APP_PATH"
xcrun simctl launch "$DEVICE_UDID" "$BUNDLE_ID"

log "Uygulama simülatörde başlatıldı ($BUNDLE_ID)."
log "Backend: http://127.0.0.1:8000 — simülatör bu adrese bağlanır."

tail -f /dev/null
