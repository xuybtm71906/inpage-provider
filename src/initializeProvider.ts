import { Duplex } from 'stream';
import MosoInpageProvider, { MosoInpageProviderOptions } from './MosoInpageProvider';
import shimWeb3 from './shimWeb3';

interface InitializeProviderOptions extends MosoInpageProviderOptions {

  /**
   * The stream used to connect to the wallet.
   */
  connectionStream: typeof Duplex;

  /**
   * Whether the provider should be set as window.ethereum.
   */
  shouldSetOnWindow?: boolean;

  /**
   * Whether the window.web3 shim should be set.
   */
  shouldShimWeb3?: boolean;
}

/**
 * Initializes a MosoInpageProvider and (optionally) assigns it as window.ethereum.
 *
 * @param options - An options bag.
 * @param options.connectionStream - A Node.js stream.
 * @param options.jsonRpcStreamName - The name of the internal JSON-RPC stream.
 * @param options.maxEventListeners - The maximum number of event listeners.
 * @param options.shouldSendMetadata - Whether the provider should send page metadata.
 * @param options.shouldSetOnWindow - Whether the provider should be set as window.ethereum.
 * @param options.shouldShimWeb3 - Whether a window.web3 shim should be injected.
 * @returns The initialized provider (whether set or not).
 */
export function initializeProvider({
  connectionStream,
  jsonRpcStreamName,
  logger = console,
  maxEventListeners = 100,
  shouldSendMetadata = true,
  shouldSetOnWindow = true,
  shouldShimWeb3 = false,
}: InitializeProviderOptions): MosoInpageProvider {
  let provider = new MosoInpageProvider(
    connectionStream,
    {
      jsonRpcStreamName,
      logger,
      maxEventListeners,
      shouldSendMetadata,
    },
  );

  provider = new Proxy(provider, {
    // some common libraries, e.g. web3@1.x, mess with our API
    deleteProperty: () => true,
  });

  if (shouldSetOnWindow) {
    setGlobalProvider(provider);
  }

  if (shouldShimWeb3) {
    shimWeb3(provider, logger);
  }

  return provider;
}

/**
 * Sets the given provider instance as window.ethereum and dispatches the
 * 'ethereum#initialized' event on window.
 *
 * @param providerInstance - The provider instance.
 */
export function setGlobalProvider(providerInstance: MosoInpageProvider): void {
  (window as Record<string, any>).ethereum = providerInstance;
  window.dispatchEvent(new Event('ethereum#initialized'));
}
