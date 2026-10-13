# Aventics CLI

Small developer CLI over the same Suite Host API used by the desktop product.

```powershell
node tooling\cli\aventics.mjs doctor
node tooling\cli\aventics.mjs components --json
node tooling\cli\aventics.mjs validate C:\path\to\aventics.manifest.json
```

The CLI does not duplicate discovery or validation logic; Suite Host remains authoritative.
