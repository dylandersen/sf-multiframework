# Beta → GA Migration

Migrate a UI bundle that was deployed during the Beta period to the GA model (API v67.0+). The ingredients live across the skill; this is the ordered playbook.

## Steps

1. **Bump the API version.** Set `sourceApiVersion` to `67.0` (or higher) in `sfdx-project.json`. The `uiBundle` field on `CustomApplication` does not exist in v66.0.
2. **Flip the target.** In `<bundle>.uibundle-meta.xml`, change `<target>AppLauncher</target>` → `<target>CustomApplication</target>`. `AppLauncher` is rejected on v67.0.
3. **Add the companion app.** Create `applications/<AppName>.app-meta.xml` with `<uiBundle>c__<bundleName></uiBundle>` (use the real namespace prefix instead of `c__` if the org has one).
4. **Deploy bundle + app together** in a single transaction. Deploying the `CustomApplication` before the `UIBundle` exists fails.
5. **Grant app visibility.** Add `applicationVisibilities` to the running user's profile, or use a permission set App Assignment. A brand-new `CustomApplication` is invisible in the App Launcher by default — even for System Administrator.
6. **Launch from the App Launcher** (or the `.salesforce.app` URL: `https://<instance>--c.<pod>.my.salesforce.app/app/c__<AppDeveloperName>`). Never use the old `/lwr/application/ai/c-<bundle>` URL — that was the Beta access path and no longer carries a usable session post-GA (the shell renders, then every Data SDK / Apex REST call fails with `INVALID_SESSION_ID`).
7. **Moving to a new/clean org?** The frontend alone won't work. Also deploy the Apex backend (`@RestResource` class and its full dependency tree) and every custom object it touches, or the app loads and the first call returns `Could not find a match for URL`.

## Do you need to delete first?

Common migration advice says you must `sf project delete source` the old bundle first because the stale Beta `AppMenuItem` won't regenerate. In practice a straight redeploy (steps 2–4) works in a GA-enabled org — and the source delete can itself fail with an opaque internal error. **Try the clean redeploy first;** only delete and recreate if a stale tile genuinely persists in the App Launcher.

## Prerequisite

The org must have **Salesforce Multi-Framework** enabled in Setup (one-way toggle). If it is off, the deploy fails with `UIBundle Metadata API is not enabled because the … feature gate is disabled` (and/or `The specified field isn't valid: uiBundle`). See [setup.md](setup.md).
