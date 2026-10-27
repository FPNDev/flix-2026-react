import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SHAKA_VERSION = '5.3.1';

const SOURCE_MAP_LINE = '\n//# sourceMappingURL=shaka-player.stripped.map';

const STUBS = {
  'lib/abr/simple_abr_manager.js': `
goog.provide('shaka.abr.SimpleAbrManager');

/**
 * @implements {shaka.extern.AbrManager}
 */
shaka.abr.SimpleAbrManager = class {
  constructor() {
    /** @private {!Array<!shaka.extern.Variant>} */
    this.variants_ = [];
  }

  /** @override */
  init(switchCallback, disableStreamCallback) {}

  /** @override */
  stop() {
    this.variants_ = [];
  }

  /** @override */
  release() {}

  /** @override */
  setVariants(variants, isLowLatency) {
    this.variants_ = variants;
    return true;
  }

  /** @override */
  chooseVariant(preferFastSwitching) {
    let best = this.variants_[0];
    for (const variant of this.variants_) {
      if (variant.bandwidth > best.bandwidth) {
        best = variant;
      }
    }
    return best;
  }

  /** @override */
  enable() {}

  /** @override */
  disable() {}

  /** @override */
  segmentDownloaded(deltaTimeMs, numBytes, allowSwitch, request, context) {}

  /** @override */
  trySuggestStreams() {}

  /** @override */
  getBandwidthEstimate() {
    return 0;
  }

  /** @override */
  playbackRateChanged(rate) {}

  /** @override */
  setMediaElement(mediaElement) {}

  /** @override */
  setCmsdManager(cmsdManager) {}

  /** @override */
  configure(config) {}
};
`,
  'lib/drm/drm_engine.js': `goog.provide('shaka.drm.DrmEngine');

goog.require('shaka.util.IDestroyable');
goog.requireType('shaka.net.NetworkingEngine');
goog.requireType('shaka.util.ManifestParserUtils');
goog.requireType('shaka.util.Error');

/** @implements {shaka.util.IDestroyable} */
shaka.drm.DrmEngine = class {
  /**
   * @param {shaka.drm.DrmEngine.PlayerInterface} playerInterface
   */
  constructor(playerInterface) {}

  /** @override */
  destroy() {
    return Promise.resolve();
  }

  /**
   * @param {shaka.extern.DrmConfiguration} config
   * @param {(function():boolean)=} isPreload
   */
  configure(config, isPreload) {}

  /**
   * @param {!boolean} value
   */
  setSrcEquals(value) {}

  /**
   * @param {!Array<shaka.extern.Variant>} variants
   * @param {!Array<string>} offlineSessionIds
   * @param {boolean=} isLive
   * @return {!Promise}
   */
  initForPlayback(variants, offlineSessionIds, isLive = true) {
    return Promise.resolve();
  }

  /**
   * @param {HTMLMediaElement} video
   * @return {!Promise}
   */
  async attach(video) {}

  /**
   * @return {boolean}
   */
  hasManifestInitData() {
    return false;
  }

  /**
   * @param {!shaka.extern.DrmInfo} drmInfo
   */
  updateCurrentDrmInfo(drmInfo) {}

  /**
   * @param {string} initDataType
   * @param {!Uint8Array} initData
   */
  newInitData(initDataType, initData) {}

  /**
   * @return {!Array<shaka.extern.DrmSessionMetadata>}
   */
  getActiveSessionsMetadata() {
    return [];
  }

  /**
   * @param {string=} sessionId
   */
  renewLicense(sessionId) {}

  /**
   * @param {shaka.extern.DrmSessionMetadata} sessionMetadata
   * @param {number=} retryDelaySeconds
   * @return {!Promise<boolean>}
   */
  async retryLicensing(sessionMetadata, retryDelaySeconds = 0.1) {
    return false;
  }

  /**
   * @return {number}
   */
  getExpiration() {
    return Infinity;
  }

  /**
   * @return {number}
   */
  getLicenseTime() {
    return NaN;
  }

  /**
   * @return {?shaka.extern.DrmInfo}
   */
  getDrmInfo() {
    return null;
  }

  /**
   * @return {MediaKeys}
   */
  getMediaKeys() {
    return null;
  }

  /**
   * @return {!Object<string, string>}
   */
  getKeyStatuses() {
    return {};
  }

  /** @return {!Promise} */
  async waitForActiveRequests() {}

  /**
   * @return {!Promise<!Object<string, ?shaka.extern.DrmSupportType>>}
   */
  static async probeSupport() {
    return {};
  }

  /**
   * @param {shaka.util.ManifestParserUtils.ContentType} contentType
   * @param {!BufferSource} mediaSegment
   * @return {!Promise<void>}
   */
  parseInbandPssh(contentType, mediaSegment) {
    return Promise.resolve();
  }
};

/**
 * @typedef {{
 *   netEngine: !shaka.net.NetworkingEngine,
 *   onError: function(!shaka.util.Error),
 *   onKeyStatus: function(!Object<string,string>),
 *   onExpirationUpdated: function(string,number),
 *   onEvent: function(!Event),
 * }}
 */
shaka.drm.DrmEngine.PlayerInterface;
`,
  'lib/drm/fairplay.js': `goog.provide('shaka.drm.FairPlay');

goog.require('shaka.util.BufferUtils');

shaka.drm.FairPlay = class {
  /**
   * @param {!BufferSource} initData
   * @return {string}
   */
  static defaultGetContentId(initData) {
    return '';
  }

  /**
   * @param {string} uriString
   * @return {?string}
   */
  static defaultGetKeyId(uriString) {
    return null;
  }

  /**
   * @param {!BufferSource} initData
   * @param {!BufferSource|string} contentId
   * @param {?BufferSource} cert
   * @return {!Uint8Array}
   */
  static initDataTransform(initData, contentId, cert) {
    return shaka.util.BufferUtils.toUint8(initData);
  }
};
`,
  'lib/drm/playready.js': `goog.provide('shaka.drm.PlayReady');

shaka.drm.PlayReady = class {
  /**
   * @param {!shaka.extern.xml.Node} element
   * @return {string}
   */
  static getLicenseUrl(element) {
    return '';
  }

  /**
   * @param {!Uint8Array} data
   * @return {string}
   */
  static getLicenseUrlFromPssh(data) {
    return '';
  }
};
`,
  'lib/media/clearkey_webcrypto_decryptor.js': `goog.provide('shaka.media.ClearKeyWebCryptoDecryptor');

goog.require('shaka.util.BufferUtils');
goog.require('shaka.util.IDestroyable');

/** @implements {shaka.util.IDestroyable} */
shaka.media.ClearKeyWebCryptoDecryptor = class {
  /**
   * @param {!BufferSource} data
   * @param {boolean} isInit
   * @param {!shaka.extern.DrmInfo} drmInfo
   * @return {!Promise<!Uint8Array>}
   */
  async decrypt(data, isInit, drmInfo) {
    return shaka.util.BufferUtils.toUint8(data);
  }

  /** @override */
  async destroy() {}

  /**
   * @param {?shaka.extern.DrmInfo} drmInfo
   * @return {boolean}
   */
  static shouldUse(drmInfo) {
    return false;
  }
};
`,
  'lib/util/cmcd_manager.js': `goog.provide('shaka.util.CmcdManager');

goog.requireType('shaka.net.NetworkingEngine');
goog.requireType('shaka.Player');

shaka.util.CmcdManager = class {
  /**
   * @param {shaka.Player} player
   * @param {shaka.extern.CmcdConfiguration} config
   */
  constructor(player, config) {}

  /**
   * @param {HTMLMediaElement} mediaElement
   */
  setMediaElement(mediaElement) {}

  /**
   * @param {shaka.extern.CmcdConfiguration} config
   */
  configure(config) {}

  /**
   * @param {?shaka.extern.ClientDataReporting} params
   */
  setManifestParameters(params) {}

  reset() {}

  onLoad() {}

  /**
   * @param {boolean} buffering
   */
  setBuffering(buffering) {}

  /**
   * @param {boolean} lowLatency
   */
  setLowLatency(lowLatency) {}

  /**
   * @param {number} startTimeOfLoad
   */
  setStartTimeOfLoad(startTimeOfLoad) {}

  /**
   * @param {!shaka.net.NetworkingEngine.RequestType} type
   * @param {!shaka.extern.Request} request
   * @param {shaka.extern.RequestContext=} context
   */
  applyRequestData(type, request, context = {}) {}

  /**
   * @param {!shaka.net.NetworkingEngine.RequestType} type
   * @param {!shaka.extern.Response} response
   * @param {shaka.extern.RequestContext=} context
   */
  applyResponseData(type, response, context = {}) {}

  /**
   * @param {!shaka.extern.Request} request
   */
  applyTextData(request) {}

  /**
   * @param {string} uri
   * @param {string} mimeType
   * @return {string}
   */
  appendSrcData(uri, mimeType) {
    return uri;
  }

  /**
   * @param {string} uri
   * @return {string}
   */
  appendTextTrackData(uri) {
    return uri;
  }
};
`,
  'lib/util/cmsd_manager.js': `goog.provide('shaka.util.CmsdManager');

shaka.util.CmsdManager = class {
  /**
   * @param {shaka.extern.CmsdConfiguration} config
   */
  constructor(config) {}

  /**
   * @param {shaka.extern.CmsdConfiguration} config
   */
  configure(config) {}

  reset() {}

  /**
   * @param {!Object<string, string>} headers
   */
  processHeaders(headers) {}
};
`,
  'lib/util/ts_parser.js': `goog.provide('shaka.util.TsParser');

shaka.util.TsParser = class {
  clearData() {}

  /**
   * @param {number} discontinuitySequence
   */
  setDiscontinuitySequence(discontinuitySequence) {}

  /**
   * @param {Uint8Array} data
   * @return {!shaka.util.TsParser}
   */
  parse(data) {
    return this;
  }

  /**
   * @return {!Array<shaka.extern.ID3Metadata>}
   */
  getMetadata() {
    return [];
  }

  /**
   * @return {!Array<shaka.extern.MPEG_PES>}
   */
  getAudioData() {
    return [];
  }

  /**
   * @param {string} contentType
   * @return {?number}
   */
  getStartTimeFromPesHeaders(contentType) {
    return null;
  }

  /**
   * @return {{audio: ?string, video: ?string}}
   */
  getCodecs() {
    return {audio: null, video: null};
  }

  /**
   * @return {{
   *   height: ?string,
   *   width: ?string,
   *   codec: ?string,
   *   frameRate: ?number,
   * }}
   */
  getVideoInfo() {
    return {height: null, width: null, codec: null, frameRate: null};
  }

  /**
   * @param {Uint8Array} data
   * @return {boolean}
   */
  static probe(data) {
    return false;
  }
};

/**
 * @typedef {{
 *   channelCount: number,
 *   channelConfigCode: number,
 *   sampleRate: number,
 * }}
 */
shaka.util.TsParser.OpusMetadata;
`,
  'lib/text/speech_to_text.js': `goog.provide('shaka.text.SpeechToText');

goog.require('shaka.util.IReleasable');
goog.requireType('shaka.Player');

/** @implements {shaka.util.IReleasable} */
shaka.text.SpeechToText = class {
  /**
   * @param {shaka.Player} player
   */
  constructor(player) {}

  /**
   * @param {shaka.extern.SpeechToTextConfiguration} config
   */
  configure(config) {}

  /** @override */
  release() {}

  /**
   * @param {!shaka.extern.TextTrack} track
   */
  enable(track) {}

  disable() {}

  /**
   * @return {!Array<shaka.extern.TextTrack>}
   */
  getTextTracks() {
    return [];
  }
};
`,
  'lib/transmuxer/transmuxer_engine.js': `goog.provide('shaka.transmuxer.TransmuxerEngine');

shaka.transmuxer.TransmuxerEngine = class {
  /**
   * @param {string} mimeType
   * @param {string=} contentType
   * @return {?shaka.extern.TransmuxerPlugin}
   */
  static findTransmuxer(mimeType, contentType) {
    return null;
  }

  /**
   * @param {string} mimeType
   * @param {shaka.extern.TransmuxerPlugin} plugin
   * @return {?number}
   */
  static findTransmuxerPluginPriority(mimeType, plugin) {
    return null;
  }

  /**
   * @param {string} mimeType
   * @param {string=} contentType
   * @return {boolean}
   */
  static isSupported(mimeType, contentType) {
    return false;
  }

  /**
   * @param {string} contentType
   * @param {string} mimeType
   * @return {string}
   */
  static convertCodecs(contentType, mimeType) {
    return mimeType;
  }
};
`,
  'lib/transmuxer/transmuxer_proxy.js': `goog.provide('shaka.transmuxer.TransmuxerProxy');

/**
 * @implements {shaka.extern.Transmuxer}
 */
shaka.transmuxer.TransmuxerProxy = class {
  /**
   * @param {!shaka.extern.Transmuxer} innerTransmuxer
   * @param {string=} workerUrl
   * @param {?number=} pluginPriority
   */
  constructor(innerTransmuxer, workerUrl = '', pluginPriority = null) {
    /** @private {!shaka.extern.Transmuxer} */
    this.inner_ = innerTransmuxer;
  }

  /**
   * @override
   */
  destroy() {
    this.inner_.destroy();
  }

  /**
   * @override
   */
  isSupported(mimeType, contentType) {
    return this.inner_.isSupported(mimeType, contentType);
  }

  /**
   * @override
   */
  convertCodecs(contentType, mimeType) {
    return this.inner_.convertCodecs(contentType, mimeType);
  }

  /**
   * @override
   */
  getOriginalMimeType() {
    return this.inner_.getOriginalMimeType();
  }

  /**
   * @override
   */
  transmux(data, stream, reference, duration, contentType) {
    return this.inner_.transmux(data, stream, reference, duration, contentType);
  }
};
`,
  'lib/metadata/id3_utils.js': `goog.provide('shaka.metadata.Id3Utils');

shaka.metadata.Id3Utils = class {
  /**
   * @param {Uint8Array} id3Data
   * @return {!Array<shaka.extern.MetadataFrame>}
   */
  static getID3Frames(id3Data) {
    return [];
  }

  /**
   * @param {Uint8Array} id3Data
   * @param {number=} offset
   * @return {!Uint8Array}
   */
  static getID3Data(id3Data, offset = 0) {
    return new Uint8Array(0);
  }
};
`,
};

const CORE_REMOVALS = [
  '+../../lib/abr/ewma_bandwidth_estimator.js\n',
  '+../../lib/text/ui_text_displayer.js\n',
  '+../../lib/text/stub_text_displayer.js\n',
];

const CML_CMCD_BLOCK = /(?:\+\.\.\/\.\.\/third_party\/cml-cmcd\/[^\n]+\n)+/g;

const GET_MANIFEST_WARNING = `    shaka.log.alwaysWarn(
        'Shaka Player\\'s internal Manifest structure is NOT covered by ' +
        'semantic versioning compatibility guarantees.  It may change at any ' +
        'time!  Please consider filing a feature request for whatever you ' +
        'use getManifest() for.');
`;

const UPSTREAM_TEXT_DISPLAY_FACTORY = `      // We prefer NativeTextDisplayer when using PiP and Fullscreen API of the
      // video element itself.
      const shouldPreferUITextDisplayer = () => {
        if (!this.videoContainer_) {
          return false;
        }
        const video = /** @type {HTMLVideoElement} */(this.video_);
        if (video.webkitDisplayingFullscreen) {
          return false;
        }
        if (video.webkitPresentationMode &&
            video.webkitPresentationMode != 'inline') {
          return false;
        }
        return true;
      };
      if (shouldPreferUITextDisplayer()) {
        return new shaka.text.UITextDisplayer(player);
      } else {
        if ('track' in document.createElement('track')) {
          return new shaka.text.NativeTextDisplayer(player);
        } else {
          shaka.log.warning('Text tracks are not supported by the ' +
                            'browser, disabling.');
          return new shaka.text.StubTextDisplayer();
        }
      }
    };
`;

const TEXT_DISPLAY_FACTORY = `      return new shaka.text.NativeTextDisplayer(player);
    };
`;

function applyPatches(root) {
  const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
  const write = (file, text) => fs.writeFileSync(path.join(root, file), text);
  const replaceOnce = (file, from, to) => {
    const text = read(file);
    if (text.split(from).length !== 2) {
      throw new Error(
        `Patch anchor not found exactly once in ${file}: ${from}`,
      );
    }
    write(
      file,
      text.replace(from, () => to),
    );
  };

  for (const [file, body] of Object.entries(STUBS)) {
    if (!fs.existsSync(path.join(root, file))) {
      throw new Error(`Stub target missing: ${file}`);
    }
    write(file, body);
  }

  replaceOnce('lib/player.js', GET_MANIFEST_WARNING, '');
  replaceOnce(
    'lib/player.js',
    "goog.require('shaka.text.UITextDisplayer');\n",
    '',
  );
  replaceOnce(
    'lib/player.js',
    "goog.require('shaka.text.StubTextDisplayer');\n",
    '',
  );
  replaceOnce(
    'lib/player.js',
    UPSTREAM_TEXT_DISPLAY_FACTORY,
    TEXT_DISPLAY_FACTORY,
  );

  for (const line of CORE_REMOVALS) {
    replaceOnce('build/types/core', line, '');
  }
  const core = read('build/types/core');
  const cmlBlocks = core.match(CML_CMCD_BLOCK) ?? [];
  if (cmlBlocks.length !== 1) {
    throw new Error(
      'cml-cmcd block not found exactly once in build/types/core',
    );
  }
  write('build/types/core', core.replace(cmlBlocks[0], ''));
}

const BUILD_ARGS = [
  '--name',
  'stripped',
  '--mode',
  'release',
  '--langout',
  'ECMASCRIPT_2021',
  '--skip-ts',
  '--skip-worker',
  '+@hls',
  '+lib/net/http_fetch_plugin.js',
  '+lib/net/http_plugin_utils.js',
  '+lib/text/vtt_text_parser.js',
  '+@polyfill',
  '-lib/polyfill/eme_encryption_scheme.js',
  '-lib/polyfill/encryption_scheme_media_key_system_access.js',
  '-lib/polyfill/encryption_scheme_utils.js',
  '-lib/polyfill/mcap_encryption_scheme.js',
  '-lib/polyfill/media_key_status_map.js',
  '-lib/polyfill/patchedmediakeys_cert.js',
  '-lib/polyfill/patchedmediakeys_webkit.js',
];

const repoRoot = path.resolve(import.meta.dirname, '..');
const { version } = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, 'node_modules/shaka-player/package.json'),
    'utf8',
  ),
);
if (version !== SHAKA_VERSION) {
  throw new Error(
    `Installed shaka-player ${version} does not match SHAKA_VERSION ${SHAKA_VERSION}. Types and vendor build must use the same version.`,
  );
}
const output = path.join(repoRoot, 'src/vendor/shaka-player.stripped.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shaka-'));

process.on('SIGINT', () => {});

try {
  execFileSync(
    'git',
    [
      '-c',
      'core.autocrlf=false',
      'clone',
      '--depth',
      '1',
      '--branch',
      `v${SHAKA_VERSION}`,
      'https://github.com/shaka-project/shaka-player',
      tmp,
    ],
    { stdio: 'inherit' },
  );
  applyPatches(tmp);
  execFileSync('python', ['build/build.py', ...BUILD_ARGS], {
    cwd: tmp,
    stdio: 'inherit',
    env: { ...process.env, npm_config_allow_git: 'all' },
  });
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const built = fs.readFileSync(
    path.join(tmp, 'dist/shaka-player.stripped.js'),
    'utf8',
  );
  if (built.split(SOURCE_MAP_LINE).length !== 2) {
    throw new Error(
      `Source map line not found exactly once in dist/shaka-player.stripped.js: ${SOURCE_MAP_LINE}`,
    );
  }
  fs.writeFileSync(output, built.replace(SOURCE_MAP_LINE, ''));
  console.log(
    `shaka-player ${SHAKA_VERSION}: ${fs.statSync(output).size} bytes`,
  );
} finally {
  try {
    fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5 });
  } catch (error) {
    console.error(`Could not remove temp dir ${tmp}:`, error);
  }
}
