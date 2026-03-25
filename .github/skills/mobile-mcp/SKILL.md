---
name: mobile-mcp
description: >
  Automate native iOS and Android apps on simulators, emulators, and real devices using Mobile MCP.
  Use for topics related to mobile testing, app automation, tap, swipe, screenshot, launch app,
  install app, device interaction, android emulator, ios simulator, mobile UI testing.
---

# Mobile Automation with Mobile MCP

> MCP server for native iOS & Android automation on simulators, emulators, and real devices.
> Uses accessibility trees for fast, LLM-friendly element identification.
> Package: `@mobilenext/mobile-mcp`

## Setup

### Copilot CLI MCP config (`~/.copilot/mcp-config.json`)

```json
{
  "mcpServers": {
    "mobile-mcp": {
      "type": "local",
      "command": "npx",
      "tools": ["*"],
      "args": ["@mobilenext/mobile-mcp@latest"]
    }
  }
}
```

Or add interactively: `/mcp add`

### Prerequisites

- **Node.js** v22+
- **Android**: Android SDK Platform Tools (`adb` on PATH), emulator or real device connected
- **iOS** (macOS only): Xcode command line tools, simulator or real device

### Verify device connectivity

```bash
# Android
adb devices

# iOS (macOS)
xcrun simctl list
```

## Tools Reference

> All tools that interact with a device require a `device` parameter (device ID).
> Always call `mobile_list_available_devices` first to get the device ID.

### Device Management

| Tool | Description | Parameters |
|---|---|---|
| `mobile_list_available_devices` | List all available devices (real + simulators/emulators) | — |
| `mobile_get_screen_size` | Get screen dimensions in pixels | `device` |
| `mobile_get_orientation` | Get current orientation (portrait/landscape) | `device` |
| `mobile_set_orientation` | Change orientation | `device`, `orientation` |

### App Management

| Tool | Description | Parameters |
|---|---|---|
| `mobile_list_apps` | List installed apps | `device` |
| `mobile_launch_app` | Launch app by package name | `device`, `packageName`, `locale?` |
| `mobile_terminate_app` | Stop a running app | `device`, `packageName` |
| `mobile_install_app` | Install from file (.apk/.ipa/.app/.zip) | `device`, `path` |
| `mobile_uninstall_app` | Uninstall by bundle/package ID | `device`, `bundle_id` |

### Screen Interaction

| Tool | Description | Parameters |
|---|---|---|
| `mobile_take_screenshot` | Take screenshot (returns image to agent) | `device` |
| `mobile_save_screenshot` | Save screenshot to file (.png/.jpg) | `device`, `saveTo` |
| `mobile_list_elements_on_screen` | List UI elements with coordinates and labels | `device` |
| `mobile_click_on_screen_at_coordinates` | Tap at x,y | `device`, `x`, `y` |
| `mobile_double_tap_on_screen` | Double-tap at x,y | `device`, `x`, `y` |
| `mobile_long_press_on_screen_at_coordinates` | Long press at x,y | `device`, `x`, `y`, `duration?` (ms, default 500) |
| `mobile_swipe_on_screen` | Swipe in direction | `device`, `direction` (up/down/left/right), `x?`, `y?`, `distance?` |

### Input & Navigation

| Tool | Description | Parameters |
|---|---|---|
| `mobile_type_keys` | Type text into focused element | `device`, `text`, `submit` (bool — press Enter after) |
| `mobile_press_button` | Press hardware/nav button | `device`, `button` |
| `mobile_open_url` | Open URL in device browser | `device`, `url` |

**Supported buttons for `mobile_press_button`:**
`HOME`, `BACK` (Android only), `ENTER`, `VOLUME_UP`, `VOLUME_DOWN`, `DPAD_CENTER`, `DPAD_UP`, `DPAD_DOWN`, `DPAD_LEFT`, `DPAD_RIGHT` (DPAD = Android TV only)

## Workflow Pattern

Every interaction follows this pattern:

```
1. mobile_list_available_devices          → get device ID
2. mobile_launch_app (or mobile_open_url) → open the target app/page
3. mobile_list_elements_on_screen         → find element coordinates
4. mobile_click_on_screen_at_coordinates  → tap the element
5. mobile_type_keys                       → enter text if needed
6. Repeat steps 3-5 as needed
```

**Key tips:**
- Always call `mobile_list_elements_on_screen` before tapping — **never cache element coordinates** as they change between screens.
- Use `mobile_take_screenshot` to visually verify the screen state when element data is ambiguous.
- Use `mobile_swipe_on_screen` to scroll if the target element is off-screen.
- After tapping or navigating, call `mobile_list_elements_on_screen` again to get the updated UI state.

## Example: Test login flow on Android emulator

```
1. mobile_list_available_devices
   → pick the Android emulator ID (e.g., "emulator-5554")

2. mobile_launch_app
   device: "emulator-5554"
   packageName: "com.example.myapp"

3. mobile_list_elements_on_screen
   device: "emulator-5554"
   → find "Log in" button coordinates

4. mobile_click_on_screen_at_coordinates
   device: "emulator-5554"
   x: 196, y: 85

5. mobile_list_elements_on_screen
   → find email input field

6. mobile_click_on_screen_at_coordinates
   → tap email field

7. mobile_type_keys
   device: "emulator-5554"
   text: "user@example.com"
   submit: false

8. mobile_list_elements_on_screen
   → find password field, tap it, type password

9. mobile_click_on_screen_at_coordinates
   → tap "Submit" button

10. mobile_take_screenshot
    → verify result
```

## Example: Install and test an APK

```
1. mobile_list_available_devices → get device ID
2. mobile_install_app
   device: "emulator-5554"
   path: "./app/build/outputs/apk/debug/app-debug.apk"
3. mobile_launch_app
   device: "emulator-5554"
   packageName: "com.example.myapp"
4. mobile_take_screenshot → verify app launched
```

## Example: Navigate with swipe and back button

```
1. mobile_swipe_on_screen
   device: "emulator-5554"
   direction: "up"         → scroll down

2. mobile_list_elements_on_screen → find element after scrolling

3. mobile_press_button
   device: "emulator-5554"
   button: "BACK"          → go back (Android)
```

## Cut The Crap App Notes

- **Android package name**: Check with `mobile_list_apps` after installing
- **Deep link scheme**: `cutthecrap://` — use `mobile_open_url` with `cutthecrap://auth?code=...` for auth callbacks
- **Login flow**: Tap "Log in" → opens WorkOS OAuth in browser → redirects back via deep link
- The app uses Expo — on Android emulator, the dev server is reached at `10.0.2.2:8081`
