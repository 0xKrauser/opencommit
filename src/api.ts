import { intro, outro } from '@clack/prompts';
import axios from 'axios';
import chalk from 'chalk';
import {
  ChatCompletionRequestMessage,
  Configuration as OpenAiApiConfiguration,
  OpenAIApi
} from 'openai';

import { CONFIG_MODES, getConfig } from './commands/config';

const config = getConfig();

let apiKey = config?.OPENCOMMIT_OPENAI_API_KEY;

const [command, mode] = process.argv.slice(2);

if (!apiKey && command !== 'config' && mode !== CONFIG_MODES.set) {
  intro('opencommit');

  outro(
    'OPENCOMMIT_OPENAI_API_KEY is not set, please run `oc config set OPENCOMMIT_OPENAI_API_KEY=<your token>. Make sure you add payment details, so API works.`'
  );
  outro(
    'For help look into README https://github.com/di-sukharev/opencommit#setup'
  );

  process.exit(1);
}

class OpenAi {
  private openAiApiConfiguration = new OpenAiApiConfiguration({
    apiKey: apiKey
  });

  private openAI = new OpenAIApi(this.openAiApiConfiguration);

  public generateCommitMessage = async (
    messages: Array<ChatCompletionRequestMessage>
  ): Promise<string | undefined> => {
    try {
      const { data } = await this.openAI.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0,
        top_p: 0.1,
        max_tokens: 196
      });

      const message = data.choices[0].message;

      return message?.content;
    } catch (error: unknown) {
      outro(`${chalk.red('✖')} ${error}`);

      if (axios.isAxiosError<{ error?: { message: string } }>(error) && error.response?.status === 401) {
        const openAiError = error.response.data.error;

        if (openAiError?.message) outro(openAiError.message);
        outro(
          'For help look into README https://github.com/di-sukharev/opencommit#setup'
        );
      }

      process.exit(1);
    }
  };
}

export const api = new OpenAi();
