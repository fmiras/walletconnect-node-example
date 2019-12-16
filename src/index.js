global['WebSocket'] = require('ws')

const ora = require('ora')
const chalk = require('chalk')
const WalletConnect = require('@walletconnect/node').default
const WalletConnectQRCodeTerminal = require('@walletconnect/qrcode-terminal').default

let spinner

function fail(message, err) {
  if (spinner) {
    spinner.fail(message)
    console.error(err)
  } else {
    console.error(message, err)
  }
  process.exit(1)
}

// Create a walletConnector
const walletConnector = new WalletConnect({
  bridge: 'https://bridge.walletconnect.org' // Required
})

// Check if connection is already established
if (!walletConnector.connected) {
  walletConnector._clientMeta = {
    name: 'truffle-wc-provider',
    description: 'WalletConnect Provider for Truffle',
    url: '#',
    icons: ['https://walletconnect.org/walletconnect-logo.png']
  }

  // create new session
  walletConnector
    .createSession()
    .then(() => {
      // get uri for printing at the console
      const uri = walletConnector.uri

      console.log(
        `Scan the following QR with your ${chalk.bold('WalletConnect-compatible wallet')}\n`
      )
      // show QR at console
      WalletConnectQRCodeTerminal.show(uri).then(() => {
        spinner = ora('Waiting for connection').start()
      })
    })
    .catch(err => {
      fail('There was an error during WalletConnect initialization', err)
    })
}

// Subscribe to connection events
walletConnector.on('connect', error => {
  if (error) {
    fail('There was en error during WalletConnect connection', error)
  }

  spinner.succeed('Wallet connected!')
  spinner = ora('Waiting for message to be sign').start()

  const address = walletConnector.accounts[0]

  walletConnector
    .signPersonalMessage([address, 'An example message to sign'])
    .then(signature => {
      spinner.succeed(`Message signed! Signature: ${chalk.bold(signature)}`)
      process.exit(0)
    })
    .catch(err => {
      fail('There was en error during the sign request', err)
    })
})

walletConnector.on('disconnect', () => {
  fail('Wallet disconnected!')
  process.exit(1)
})
