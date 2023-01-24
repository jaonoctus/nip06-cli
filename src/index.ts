#!/bin/env node
import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import inquirerPrompt from 'inquirer-autocomplete-prompt'
import {
  generateSeedWords,
  privateKeyFromSeedWords,
  getPublicKey,
  getBech32PrivateKey,
  getBech32PublicKey,
  validateWords
} from 'nip06'
import * as fuzzy from 'fuzzy'
import { version } from '../package.json'
import { wordlist } from '@scure/bip39/wordlists/english'

inquirer.registerPrompt('autocomplete', inquirerPrompt)

const program = new Command()

program
  .name('nip06-cli')
  .description('NodeJS CLI to generate or restore Nostr NIP-06')
  .version(version, '-v, --version')

program
  .command('random')
  .description('Generate a random mnemonic')
  .action(async () => {
    let passphrase = ''

    const { usePassphrase } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'usePassphrase',
        message: 'Do you want to use a passphrase?',
        default: false
      }
    ])

    if (usePassphrase) {
      ({ passphrase } = await inquirer.prompt([
        {
          type: 'input',
          name: 'passphrase',
          message: 'Passphrase:'
        }
      ]))
    }

    const { mnemonic } = generateSeedWords()
    outputKeys({ mnemonic, passphrase })
  })

program
  .command('restore')
  .description('Restore an existing mnemonic')
  .option('-m, --mnemonic <mnemonic>')
  .option('-p, --passphrase <passphrase>', '')
  .action(async (cmd?: { mnemonic?: string, passphrase: string }) => {
    let passphrase = ''
    let mnemonic

    if (!cmd?.mnemonic) {
      let words = []
      const { wordsCount } = await inquirer.prompt([
        {
          type: 'list',
          name: 'wordsCount',
          message: 'Mnemonic size:',
          choices: [12, 24],
          default: 12
        },
      ])

      for(let i = 0; i < wordsCount; i++) {
        const { word } = await askWord(i)
        words.push(word)
      }

      mnemonic = words.join(' ')

      const { usePassphrase } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'usePassphrase',
          message: 'Do you want to use a passphrase?',
          default: false
        }
      ])

      if (usePassphrase) {
        ({ passphrase } = await inquirer.prompt([
          {
            type: 'input',
            name: 'passphrase',
            message: 'Passphrase:'
          }
        ]))
      }
    } else {
      mnemonic = cmd.mnemonic
      passphrase = cmd.passphrase
    }

    const { isMnemonicValid } = validateWords({ mnemonic })

    if (!isMnemonicValid) {
      console.log(chalk.bold(chalk.red('[ERROR] INVALID MNEMONIC')))
      console.log(chalk.yellow('>'), 'mnemonic:', chalk.red(mnemonic))
      return
    }

    outputKeys({ mnemonic, passphrase })
  })

program.parse(process.argv)

async function askWord(index: number) {
  const { word } = await inquirer.prompt([
    {
      type: 'autocomplete',
      name: 'word',
      message: `Word [${index + 1}]:`,
      source: searchWord,
      default: ''
    },
  ])

  return { word }
}

function searchWord(_answersSoFar: any, input = '') {
  return new Promise((resolve) => {
    const wordsStartsWithInput = wordlist.filter((word) => word.startsWith(input))

    if (Array.isArray(wordsStartsWithInput) && wordsStartsWithInput.length > 0) {
      resolve(wordsStartsWithInput)
    }

    resolve(fuzzy.filter(input, wordlist).map((el) => el.original))
  })
}

function outputKeys({ mnemonic, passphrase }: { mnemonic: string, passphrase?: string }) {
  const { privateKey } = privateKeyFromSeedWords({ mnemonic, passphrase })
  const { publicKey } = getPublicKey({ privateKey })
  const { bech32PrivateKey } = getBech32PrivateKey({ privateKey })
  const { bech32PublicKey } = getBech32PublicKey({ publicKey })

  console.log(chalk.gray('mnemonic:'), chalk.bgCyan(mnemonic))
  console.log(chalk.gray('hex private key:'), chalk.cyan(privateKey))
  console.log(chalk.gray('hex public key:'), chalk.cyan(publicKey))
  console.log(chalk.gray('bech32 private key:'), chalk.cyan(bech32PrivateKey))
  console.log(chalk.gray('bech32 public key:'), chalk.cyan(bech32PublicKey))
}
