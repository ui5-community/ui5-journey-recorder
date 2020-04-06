# UI5 Test Recorder – Changelog


## 0.6.0

For this version, we performed an extensive refactoring in the context of Issue [#10](https://github.com/msg-systems/ui5-testrecorder/issues/10), while we did not stop there.
Due to the extent of the refactoring, only the most important user-visible changes are listed below.
For further details, please see PR [#36](https://github.com/msg-systems/ui5-testrecorder/pull/36).

### Added
- Actually execute asserts during replay (7069fcc)
- Actually execute support assistant during replay (fe4d04c)
- Gather and show messages during replay in a MessagePopover (b742c11, 4e239fd)
- The page under test is now locked when it is not to be accessed (0232cc6)
- Further user feedback is shown when extension or page disconnects/reloads (e.g., 17f7922, ba7a716, 7b35702, 9bd5167, and 8b102cd)
- Add changelog file [CHANGELOG.md](CHANGELOG.md) (see Issue [#33](https://github.com/msg-systems/ui5-testrecorder/issues/33))


### Changed/Improved
- Page injection and connection handling now uses WebExtension functionality, which improves stability (see Issue [#10](https://github.com/msg-systems/ui5-testrecorder/issues/10))
- Replay can be stopped (69fcb66).
- Use a single button 'Replay next step' during manual replay
- Disable test-step handling during replay (8283ae9)
- Refactor README file [README.md](README.md) (see Issue [#34](https://github.com/msg-systems/ui5-testrecorder/issues/34))

### Fixed
- Fix potential page injection problem with item properties (072a04e)
- Fix highlighting of selected element in page under test (1db2b70)


## 0.5.2

### Added
- Automatic closing of old tabs on replay
- Offline view of single test steps

### Fixed
- Removed recurring calls regarding successful page injection that broke the replay option
- Fixed the controller 'TestDetails' for better replay
