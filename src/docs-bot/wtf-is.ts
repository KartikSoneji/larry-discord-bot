import { CommandInteraction } from 'discord.js';
import errorMap from './errorMap.json';

export async function wtfIs(interaction: CommandInteraction) {
    const query = interaction.options.getString('code', true);
    const hidden = interaction.options.getBoolean('hidden');

    await interaction.deferReply({ ephemeral: hidden ?? true });

    const message = getMessagesForQuery(query);
    await interaction.editReply(message);
}

export function getMessagesForQuery(query: string): string {
    if (!query.startsWith('0x') && query.match(/[a-fA-F]/))
        return `Hex strings must be prefixed by "0x"\n__Hint: try 0x${query}__`;

    const code = parseInt(query);
    if (isNaN(code)) return `Could not parse error code: ${query}`;

    let maxWidth = 0;
    const hexError = code.toString(16).toUpperCase();
    const errorMessages = errorMap
        .map(({ domain, errors }) => {
            let typedErrors = errors as { [key: string]: string | undefined };
            maxWidth = Math.max(maxWidth, domain.length);
            if (typedErrors[hexError] !== undefined) return [domain, typedErrors[hexError]];
            else return null;
        })
        .filter((error): error is [string, string] => error != null)
        .map(([domain, message]) => `- ${domain.padEnd(maxWidth)} | ${message}`);
    if (errorMessages.length === 0) return `Error code not found: ${query}`;

    return `**Error code 0x${code.toString(16)} can be:**\n${errorMessages.join('\n')}`;
}