const {
  withXcodeProject,
} = require("expo/config-plugins");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const APP_GROUP = "group.com.cutthecrap.app";
const EXTENSION_NAME = "ShareExtension";
const EXTENSION_BUNDLE_ID = "com.cutthecrap.app.ShareExtension";
const APPLE_TEAM_ID = "RS528XGBD7";
const EXTENSION_PROFILE_FILENAME =
  "Cut_The_Crap_Share_Extension_Provisioning_Profile.mobileprovision";

/**
 * Expo config plugin that adds an iOS Share Extension target.
 *
 * This enables "Share to Cut The Crap" from Safari and other apps.
 * The extension receives a URL, writes it to App Group UserDefaults,
 * then opens the main app via deep link.
 */
const withShareExtension = (config) => {
  // The Share Extension communicates with the main app via URL scheme
  // (cutthecrap://extract?url=...), so the main app does NOT need App Groups.
  // The extension itself has App Groups in its own entitlements.

  // 1. Add the Share Extension target to the Xcode project
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const bundleId = EXTENSION_BUNDLE_ID;
    const targetName = EXTENSION_NAME;
    const platformProjectRoot = config.modRequest.platformProjectRoot; // ios/

    // Write the extension source files to disk
    const extensionDir = path.join(platformProjectRoot, targetName);
    if (!fs.existsSync(extensionDir)) {
      fs.mkdirSync(extensionDir, { recursive: true });
    }

    // ShareViewController.swift
    fs.writeFileSync(
      path.join(extensionDir, "ShareViewController.swift"),
      getShareViewControllerSource()
    );

    // Info.plist for the extension
    fs.writeFileSync(
      path.join(extensionDir, "Info.plist"),
      getExtensionInfoPlist()
    );

    // Entitlements for the extension (App Group)
    const entitlementsFileName = `${targetName}.entitlements`;
    fs.writeFileSync(
      path.join(extensionDir, entitlementsFileName),
      getExtensionEntitlements()
    );

    // Install the Share Extension provisioning profile so Xcode can find it
    const projectRoot = config.modRequest.projectRoot; // frontend/
    const profileSrc = path.resolve(projectRoot, "..", EXTENSION_PROFILE_FILENAME);
    let profileUUID = null;
    if (fs.existsSync(profileSrc)) {
      try {
        const plistXml = execSync(
          `security cms -D -i "${profileSrc}"`,
          { encoding: "utf8" }
        );
        const uuidMatch = plistXml.match(
          /<key>UUID<\/key>\s*<string>([^<]+)<\/string>/
        );
        if (uuidMatch) {
          profileUUID = uuidMatch[1];
          const profilesDir = path.join(
            process.env.HOME,
            "Library",
            "MobileDevice",
            "Provisioning Profiles"
          );
          if (!fs.existsSync(profilesDir)) {
            fs.mkdirSync(profilesDir, { recursive: true });
          }
          fs.copyFileSync(
            profileSrc,
            path.join(profilesDir, `${profileUUID}.mobileprovision`)
          );
        }
      } catch (e) {
        console.warn("Could not install Share Extension provisioning profile:", e.message);
      }
    }

    // Check if target already exists
    const existingTarget = xcodeProject.pbxTargetByName(targetName);
    if (existingTarget) {
      return config;
    }

    // Add the Share Extension target
    const target = xcodeProject.addTarget(
      targetName,
      "app_extension",
      targetName,
      bundleId
    );

    // Add a PBX group for the extension files
    const groupName = targetName;
    const group = xcodeProject.addPbxGroup(
      ["Info.plist", entitlementsFileName],
      groupName,
      targetName
    );

    // Add the group to the main project group
    const mainGroupId = xcodeProject.getFirstProject().firstProject.mainGroup;
    xcodeProject.addToPbxGroup(group.uuid, mainGroupId);

    // Add Swift source to the extension target's Sources build phase only.
    // We use addBuildPhase directly to avoid addSourceFile adding it to the
    // main target.
    xcodeProject.addBuildPhase(
      [`${targetName}/ShareViewController.swift`],
      "PBXSourcesBuildPhase",
      "Sources",
      target.uuid
    );

    // Register the file reference so Xcode can find it
    const fileRef = xcodeProject.addFile(
      "ShareViewController.swift",
      group.uuid,
      {}
    );
    if (fileRef) {
      // Ensure file is in the group's children but NOT in main target
      // addFile already adds it to the group
    }

    // Configure build settings for the extension target
    const configurations = xcodeProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (
        typeof configurations[key] === "object" &&
        configurations[key].buildSettings
      ) {
        const buildSettings = configurations[key].buildSettings;
        // Only modify configs belonging to our target
        const configName = configurations[key].name;
        if (!configName) continue;

        // Find configs associated with our target
        const targetConfigs =
          xcodeProject.pbxXCConfigurationList()[
            target.pbxNativeTarget.buildConfigurationList
          ];
        if (!targetConfigs) continue;

        const isTargetConfig = targetConfigs.buildConfigurations.some(
          (c) => c.value === key
        );
        if (!isTargetConfig) continue;

        buildSettings.PRODUCT_NAME = `"${targetName}"`;
        buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${bundleId}"`;
        buildSettings.SWIFT_VERSION = "5.0";
        buildSettings.TARGETED_DEVICE_FAMILY = `"1,2"`;
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "16.0";
        buildSettings.CODE_SIGN_ENTITLEMENTS = `"${targetName}/${entitlementsFileName}"`;
        buildSettings.INFOPLIST_FILE = `"${targetName}/Info.plist"`;
        buildSettings.CODE_SIGN_STYLE = "Automatic";
        buildSettings.DEVELOPMENT_TEAM = `"${APPLE_TEAM_ID}"`;
        buildSettings.MARKETING_VERSION = "1.0";
        buildSettings.CURRENT_PROJECT_VERSION = "1";
        buildSettings.GENERATE_INFOPLIST_FILE = "NO";
        // Inherit version from main target
        const mainTarget = xcodeProject.getFirstTarget();
        if (mainTarget) {
          const mainConfigs =
            xcodeProject.pbxXCConfigurationList()[
              mainTarget.firstTarget.buildConfigurationList
            ];
          if (mainConfigs) {
            const mainConfigKey = mainConfigs.buildConfigurations[0]?.value;
            if (mainConfigKey && configurations[mainConfigKey]?.buildSettings) {
              const mainSettings = configurations[mainConfigKey].buildSettings;
              if (mainSettings.MARKETING_VERSION) {
                buildSettings.MARKETING_VERSION = mainSettings.MARKETING_VERSION;
              }
              if (mainSettings.CURRENT_PROJECT_VERSION) {
                buildSettings.CURRENT_PROJECT_VERSION = mainSettings.CURRENT_PROJECT_VERSION;
              }
            }
          }
        }
      }
    }

    return config;
  });

  return config;
};

function getShareViewControllerSource() {
  return `import UIKit
import Social
import UniformTypeIdentifiers

class ShareViewController: UIViewController {
    private let appGroupId = "${APP_GROUP}"
    private let sharedUrlKey = "sharedUrl"
    private let appScheme = "cutthecrap"

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        handleSharedContent()
    }

    private func handleSharedContent() {
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            close()
            return
        }

        for item in extensionItems {
            guard let attachments = item.attachments else { continue }

            for provider in attachments {
                if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                    provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { [weak self] item, _ in
                        guard let self = self else { return }
                        if let url = item as? URL {
                            self.saveAndOpen(url: url.absoluteString)
                        } else if let data = item as? Data, let url = URL(dataRepresentation: data, relativeTo: nil) {
                            self.saveAndOpen(url: url.absoluteString)
                        } else {
                            self.close()
                        }
                    }
                    return
                }

                if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                    provider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { [weak self] item, _ in
                        guard let self = self else { return }
                        if let text = item as? String, let url = URL(string: text), url.scheme?.hasPrefix("http") == true {
                            self.saveAndOpen(url: text)
                        } else {
                            self.close()
                        }
                    }
                    return
                }
            }
        }

        close()
    }

    private func saveAndOpen(url: String) {
        // Save the URL to App Group UserDefaults
        if let userDefaults = UserDefaults(suiteName: appGroupId) {
            userDefaults.set(url, forKey: sharedUrlKey)
            userDefaults.synchronize()
        }

        // Open the main app via deep link
        let deepLink = "\\(appScheme)://extract?url=\\(url.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? url)"
        guard let deepLinkUrl = URL(string: deepLink) else {
            close()
            return
        }

        // Use the responder chain to open the URL
        var responder: UIResponder? = self
        while let r = responder {
            if let application = r as? UIApplication {
                application.open(deepLinkUrl, options: [:]) { [weak self] _ in
                    self?.close()
                }
                return
            }
            responder = r.next
        }

        // Fallback: open via shared application selector
        let selector = sel_registerName("openURL:")
        var currentResponder: UIResponder? = self
        while let r = currentResponder {
            if r.responds(to: selector) {
                r.perform(selector, with: deepLinkUrl)
                break
            }
            currentResponder = r.next
        }

        close()
    }

    private func close() {
        DispatchQueue.main.async {
            self.extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
        }
    }
}
`;
}

function getExtensionInfoPlist() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>Cut The Crap</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>$(MARKETING_VERSION)</string>
    <key>CFBundleVersion</key>
    <string>$(CURRENT_PROJECT_VERSION)</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionAttributes</key>
        <dict>
            <key>NSExtensionActivationRule</key>
            <dict>
                <key>NSExtensionActivationSupportsWebURLWithMaxCount</key>
                <integer>1</integer>
                <key>NSExtensionActivationSupportsText</key>
                <true/>
            </dict>
        </dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.share-services</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).ShareViewController</string>
    </dict>
</dict>
</plist>
`;
}

function getExtensionEntitlements() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${APP_GROUP}</string>
    </array>
</dict>
</plist>
`;
}

module.exports = withShareExtension;
