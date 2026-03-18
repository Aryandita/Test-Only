import { createCanvas } from 'canvas';

export async function generateMusicProfileImage(musicData) {
  const canvas = createCanvas(800, 500);
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 800, 500);
  gradient.addColorStop(0, '#0A0E27');
  gradient.addColorStop(1, '#1A233E');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 500);

  // Border
  ctx.strokeStyle = '#FF6B9D';
  ctx.lineWidth = 3;
  ctx.strokeRect(5, 5, 790, 490);

  // Header
  ctx.fillStyle = '#FF6B9D';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('🎵 Music Profile', 30, 50);

  // Username
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px Arial';
  ctx.fillText('@' + musicData.username, 30, 75);

  // Stats Grid
  let xPos = 30;
  const yPos = 120;

  const stats = [
    { label: '🎶 Total Tracks', value: musicData.totalTracksPlayed || 0 },
    {
      label: '⏱️ Listening Time',
      value: formatTime(musicData.totalListeningTime || 0),
    },
    {
      label: '🎧 Sessions',
      value: musicData.totalListeningSessions || 0,
    },
    { label: '📊 Level', value: musicData.musicLevel || 1 },
  ];

  stats.forEach((stat, index) => {
    const boxX = 30 + index * 180;
    const boxY = 110;
    const boxWidth = 170;
    const boxHeight = 70;

    // Box background
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Box border
    ctx.strokeStyle = '#FF6B9D';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // Label
    ctx.fillStyle = '#FF6B9D';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(stat.label, boxX + boxWidth / 2, boxY + 20);

    // Value
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(
      typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value,
      boxX + boxWidth / 2,
      boxY + 50
    );
  });

  // Top Tracks Section
  ctx.fillStyle = '#FF6B9D';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('🎵 Top Tracks', 30, 220);

  let trackY = 250;
  const topTracks = (musicData.frequentTracks || []).slice(0, 3);

  topTracks.forEach((track, index) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(`${index + 1}. ${track.title.substring(0, 40)}`, 40, trackY);

    ctx.fillStyle = '#B0B0B0';
    ctx.font = '11px Arial';
    ctx.fillText(
      `${track.artist.substring(0, 30)} • ${track.playCount} plays`,
      50,
      trackY + 15
    );

    trackY += 35;
  });

  // Top Artists Section
  ctx.fillStyle = '#FF6B9D';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('🎤 Top Artists', 430, 220);

  let artistY = 250;
  const topArtists = (musicData.frequentArtists || []).slice(0, 3);

  topArtists.forEach((artist, index) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(
      `${index + 1}. ${artist.artistName.substring(0, 35)}`,
      440,
      artistY
    );

    ctx.fillStyle = '#B0B0B0';
    ctx.font = '11px Arial';
    ctx.fillText(`${artist.playCount} tracks played`, 450, artistY + 15);

    artistY += 35;
  });

  // Footer - Timestamp
  const now = new Date();
  const timestamp = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  ctx.fillStyle = '#808080';
  ctx.font = '11px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`Updated: ${timestamp}`, 770, 485);

  return canvas.toBuffer('image/png');
}

export async function generateMusicListeningComparisonImage(
  user1Data,
  user2Data
) {
  const canvas = createCanvas(600, 400);
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 600, 400);
  gradient.addColorStop(0, '#0A0E27');
  gradient.addColorStop(1, '#1A233E');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 400);

  // Border
  ctx.strokeStyle = '#FF6B9D';
  ctx.lineWidth = 2;
  ctx.strokeRect(5, 5, 590, 390);

  // Title
  ctx.fillStyle = '#FF6B9D';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🎵 Listening Comparison', 300, 40);

  // User 1
  ctx.fillStyle = '#9D4EDD';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('@' + user1Data.username, 30, 90);

  // User 1 Stats
  let y = 130;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '13px Arial';

  const user1Tracks = (user1Data.frequentTracks || []).slice(0, 2);
  ctx.fillText('Favorite Tracks:', 30, y);
  user1Tracks.forEach((track) => {
    y += 20;
    ctx.fillText('• ' + track.title.substring(0, 35), 40, y);
  });

  // User 2
  y = 130;
  ctx.fillStyle = '#00D9FF';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'right';
  ctx.fillText('@' + user2Data.username, 570, 90);

  // User 2 Stats
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '13px Arial';

  const user2Tracks = (user2Data.frequentTracks || []).slice(0, 2);
  ctx.fillText('Favorite Tracks:', 570, y, 300);
  user2Tracks.forEach((track) => {
    y += 20;
    ctx.textAlign = 'right';
    ctx.fillText('• ' + track.title.substring(0, 35), 570, y);
  });

  // Timestamp
  const now = new Date();
  const timestamp = now.toLocaleDateString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  ctx.fillStyle = '#808080';
  ctx.font = '10px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`${timestamp}`, 570, 385);

  return canvas.toBuffer('image/png');
}

function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}
