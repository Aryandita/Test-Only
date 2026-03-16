import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  MessageFlags,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder
} from 'discord.js';
import { config } from './config.js';
import { AiService } from './services/ai.js';
import { MusicService } from './services/music.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  partials: [Partials.Channel]
});

const aiService = new AiService(config.geminiApiKey);
const musicService = new MusicService(client, config.lavalink);

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Cek bot online.'),
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Putar lagu dari pencarian YouTube.')
    .addStringOption((opt) => opt.setName('query').setDescription('Judul atau keyword lagu').setRequired(true)),
  new SlashCommandBuilder().setName('skip').setDescription('Skip lagu saat ini.'),
  new SlashCommandBuilder().setName('stop').setDescription('Stop lagu dan kosongkan queue.'),
  new SlashCommandBuilder().setName('queue').setDescription('Lihat antrean lagu.'),
  new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Tanya AI Gemini 2.5 Flash')
    .addStringOption((opt) => opt.setName('prompt').setDescription('Pertanyaan kamu').setRequired(true)),
  new SlashCommandBuilder().setName('restart').setDescription('Owner only: restart bot.'),
  new SlashCommandBuilder().setName('shutdown').setDescription('Owner only: matikan bot.'),
  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Owner only: kirim pengumuman lewat embed.')
    .addStringOption((opt) => opt.setName('pesan').setDescription('Isi pengumuman').setRequired(true))
].map((cmd) => cmd.toJSON());

const isOwner = (userId) => config.ownerIds.includes(userId);

async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(config.discordToken);
  await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
}

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await deployCommands();
  console.log('✅ Slash command synced.');
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isButton() && interaction.customId.startsWith('music_')) {
      await musicService.onButton(interaction);
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ping') {
      await interaction.reply({ content: 'Pong!', flags: MessageFlags.IsComponentsV2 });
      return;
    }

    if (interaction.commandName === 'play') {
      await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 });
      const query = interaction.options.getString('query', true);
      const track = await musicService.enqueue(interaction, query);

      await interaction.editReply({
        embeds: [musicService.nowPlayingEmbed(track, interaction.user.username)],
        components: musicService.controlComponents()
      });
      return;
    }

    if (interaction.commandName === 'skip') {
      const player = musicService.players.get(interaction.guildId);
      if (!player) throw new Error('Player tidak aktif.');
      await player.stopTrack();
      await interaction.reply({ content: '⏭️ Skip.', flags: MessageFlags.IsComponentsV2 });
      return;
    }

    if (interaction.commandName === 'stop') {
      const player = musicService.players.get(interaction.guildId);
      if (!player) throw new Error('Player tidak aktif.');
      musicService.getQueue(interaction.guildId).length = 0;
      await player.stopTrack();
      await interaction.reply({ content: '⏹️ Stop + queue dibersihkan.', flags: MessageFlags.IsComponentsV2 });
      return;
    }

    if (interaction.commandName === 'queue') {
      const queue = musicService.getQueue(interaction.guildId);
      const list = queue.slice(0, 10).map((t, i) => `${i + 1}. ${t.info.title}`).join('\n') || 'Kosong.';
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x2b2d31).setTitle('Queue').setDescription(list)],
        flags: MessageFlags.IsComponentsV2
      });
      return;
    }

    if (interaction.commandName === 'ai') {
      await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 });
      const prompt = interaction.options.getString('prompt', true);
      const answer = await aiService.ask({
        prompt,
        isOwner: isOwner(interaction.user.id),
        username: interaction.user.username
      });

      const persona = isOwner(interaction.user.id) ? 'Owner Persona' : 'Member Persona';
      const embed = new EmbedBuilder()
        .setColor(isOwner(interaction.user.id) ? 0xffa500 : 0x57f287)
        .setTitle(`🤖 AI Response (${persona})`)
        .setDescription(answer.slice(0, 4000));

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (interaction.commandName === 'restart') {
      if (!isOwner(interaction.user.id)) {
        await interaction.reply({ content: 'Command ini hanya owner.', flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
        return;
      }

      await interaction.reply({ content: '♻️ Bot restart sekarang...', flags: MessageFlags.IsComponentsV2 });
      process.exit(0);
    }

    if (interaction.commandName === 'shutdown') {
      if (!isOwner(interaction.user.id)) {
        await interaction.reply({ content: 'Command ini hanya owner.', flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
        return;
      }

      await interaction.reply({ content: '🛑 Bot dimatikan oleh owner.', flags: MessageFlags.IsComponentsV2 });
      await client.destroy();
      process.exit(0);
    }

    if (interaction.commandName === 'announce') {
      if (!isOwner(interaction.user.id)) {
        await interaction.reply({ content: 'Command ini hanya owner.', flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2 });
        return;
      }

      const text = interaction.options.getString('pesan', true);
      const embed = new EmbedBuilder().setColor(0xfee75c).setTitle('📢 Announcement').setDescription(text);
      await interaction.reply({ embeds: [embed], flags: MessageFlags.IsComponentsV2 });
    }
  } catch (error) {
    const payload = {
      content: `❌ Error: ${error.message ?? 'Unknown error'}`,
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  }
});

client.on('voiceStateUpdate', async (oldState) => {
  if (!oldState.guild) return;
  const me = oldState.guild.members.me;
  const myChannel = me?.voice?.channel;
  if (!myChannel || myChannel.members.size > 1) return;
  await musicService.destroy(oldState.guild.id).catch(() => null);
});

client.login(config.discordToken);
