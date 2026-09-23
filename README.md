# FLIX

Work in progress

Solved:

- [x] Integrate Shaka
- [x] Integrate player with magnet remuxer
- [x] Add hooks for tracks switching
- [x] Add basic hotkeys and basic subtitle / audio track control
- [x] Split magnet logic from player -
      it shall be pure HLS, form handles Magnet

Next steps:

- [ ] Migrate all base component from src/assets/scss/components to SCSS modules
- [ ] Implement Player UI:
  - [ ] Base UI (play/pause, volume, fullscreen, title)
  - [ ] Subtitles picker
  - [ ] Audio track picker
  - [ ] Local progress restoration
- [ ] Add hotkeys controls for new subtitles/audio pickers UI

Plan afterwards:

- [ ] Login / invited page (invite code, biometric / email-password login)
- [ ] Profile management (Default, Kids? - to be decided, probably no Kids profile)
- [ ] Watch later / collections - to be decided
- [ ] Main layout - navigation, search bar, grids
- [ ] Main page - hot releases, recommendations etc
- [ ] Search & search filters
- [ ] Advanced player UI - quality picker,
      UDP scrape for stats (location to be decided)
  - [ ] Remote progress restoration
  - [ ] Advanced hotkeys for Player UI
  - [ ] Offline downloads and offline support
- [ ] Account & profile settings
- [ ] A11y

Possibly (undecided) - separate repos to be created and referenced:

- [ ] Desktop app / mobile app via Electron/CapacitorJS
- [ ] SmartTV app - WebGL renderer, deterministic over reactive
