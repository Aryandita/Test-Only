import { SlashCommandBuilder } from 'discord.js';

export const commandDefinitions = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Putar lagu dari URL / keyword')
    .addStringOption((opt) =>
      opt.setName('query').setDescription('URL atau kata kunci YouTube').setRequired(true)
    ),
  new SlashCommandBuilder().setName('skip').setDescription('Lewati lagu saat ini'),
  new SlashCommandBuilder().setName('stop').setDescription('Hentikan musik dan keluar voice channel'),
  new SlashCommandBuilder().setName('queue').setDescription('Lihat antrian lagu'),
  new SlashCommandBuilder().setName('loop').setDescription('Toggle loop lagu saat ini'),
  new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Tanya Gemini 2.5 Flash')
    .addStringOption((opt) => opt.setName('prompt').setDescription('Pertanyaan kamu').setRequired(true)),
  new SlashCommandBuilder().setName('restart').setDescription('Restart bot (owner only)'),
  new SlashCommandBuilder().setName('owner-stats').setDescription('Lihat statistik bot (owner only)'),
  new SlashCommandBuilder().setName('owner-sync').setDescription('Sinkronisasi slash command (owner only)')
].map((command) => command.toJSON());
