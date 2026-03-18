import { createCanvas, registerFont } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getLevelColor = (level) => {
  if (level >= 100) return '#FFD700'; // Gold
  if (level >= 75) return '#C0C0C0'; // Silver
  if (level >= 50) return '#CD7F32'; // Bronze
  if (level >= 25) return '#9370DB'; // Purple
  if (level >= 10) return '#00CED1'; // Cyan
  return '#32CD32'; // Green
};

const getBackgroundGradient = (ctx, level) => {
  const gradient = ctx.createLinearGradient(0, 0, 400, 300);
  if (level >= 100) {
    gradient.addColorStop(0, '#2C2C2C');
    gradient.addColorStop(1, '#1A1A2E');
  } else if (level >= 75) {
    gradient.addColorStop(0, '#1F1F2E');
    gradient.addColorStop(1, '#0F141E');
  } else if (level >= 50) {
    gradient.addColorStop(0, '#2D1B00');
    gradient.addColorStop(1, '#1A0F00');
  } else {
    gradient.addColorStop(0, '#1A2D4D');
    gradient.addColorStop(1, '#0F1A2E');
  }
  return gradient;
};

export async function generateLevelBadge(user, level, experience, nextLevelExp) {
  const canvas = createCanvas(400, 300);
  const ctx = canvas.getContext('2d');

  // Background
  const bgGradient = getBackgroundGradient(ctx, level);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 400, 300);

  // Border
  ctx.strokeStyle = getLevelColor(level);
  ctx.lineWidth = 4;
  ctx.strokeRect(5, 5, 390, 290);

  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('LEVEL UP! 🎉', 200, 50);

  // Level Display
  ctx.fillStyle = getLevelColor(level);
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(level.toString(), 200, 140);

  // Username
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '18px Arial';
  ctx.fillText(user.substring(0, 20), 200, 170);

  // Experience Progress
  const expPercent = (experience % nextLevelExp) / nextLevelExp;
  const barWidth = 300;
  const barHeight = 20;
  const barX = 50;
  const barY = 210;

  // Experience Bar Background
  ctx.fillStyle = '#404040';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Experience Bar Fill
  ctx.fillStyle = getLevelColor(level);
  ctx.fillRect(barX, barY, barWidth * expPercent, barHeight);

  // Bar Border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Experience Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${experience % nextLevelExp} / ${nextLevelExp} EXP`,
    200,
    250
  );

  return canvas.toBuffer('image/png');
}

export async function generateProfileLevelImage(user, data) {
  const canvas = createCanvas(400, 500);
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 400, 500);
  gradient.addColorStop(0, '#0F1419');
  gradient.addColorStop(1, '#1A2A3A');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 400, 500);

  // Border
  ctx.strokeStyle = '#00CED1';
  ctx.lineWidth = 3;
  ctx.strokeRect(5, 5, 390, 490);

  // Profile Header
  ctx.fillStyle = '#00CED1';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('📊 Level Profile', 30, 50);

  let yPos = 100;

  // Level
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('Level:', 30, yPos);
  ctx.fillStyle = getLevelColor(data.level);
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(data.level.toString(), 370, yPos);
  ctx.textAlign = 'left';
  yPos += 50;

  // Experience
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Experience:', 30, yPos);
  ctx.textAlign = 'right';
  ctx.fillText(
    `${data.experience.toLocaleString()} / ${(data.nextLevelExp || 1000).toLocaleString()}`,
    370,
    yPos
  );
  ctx.textAlign = 'left';
  yPos += 50;

  // Progress Bar
  const expPercent = data.experience / (data.nextLevelExp || 1000);
  ctx.fillStyle = '#404040';
  ctx.fillRect(30, yPos - 10, 340, 15);
  ctx.fillStyle = getLevelColor(data.level);
  ctx.fillRect(30, yPos - 10, 340 * Math.min(expPercent, 1), 15);
  yPos += 40;

  // Statistics
  const stats = [
    { label: 'Messages Sent', value: data.messagesSent || 0 },
    { label: 'Total XP Earned', value: data.totalXp || 0 },
    { label: 'Rank', value: data.rank || 'N/A' },
  ];

  stats.forEach((stat) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(stat.label + ':', 30, yPos);
    ctx.textAlign = 'right';
    ctx.fillText(
      typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value,
      370,
      yPos
    );
    yPos += 35;
  });

  return canvas.toBuffer('image/png');
}
