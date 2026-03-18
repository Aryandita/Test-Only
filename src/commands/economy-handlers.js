// Economy Commands Handler Add-ons
// Tambahkan ini ke dalam async function runCommand di handlers.js sebelum default case

// Daily Check-In
case 'dailycheckin': {
  await deferReply();
  const economyService = context.economyService;
  const username = sourceChannel.guild?.members.cache.get(userId)?.user?.username || 'Unknown';
  const result = await economyService.dailyCheckIn(userId, username);
  
  if (!result) {
    await editReply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '❌ Error', description: 'Gagal melakukan check-in.' })] });
    return;
  }

  if (!result.canCheckIn) {
    const mins = Math.floor((result.hoursLeft % 1) * 60);
    await editReply({ embeds: [createDailyCheckInEmbed({ 
      reward: 0, 
      streak: 0, 
      canClaim: false, 
      hoursLeft: result.hoursLeft,
      color: env.embedHex 
    })] });
    return;
  }

  // Import createDailyCheckInEmbed from music-ui
  await editReply({ embeds: [createDailyCheckInEmbed({ 
    reward: result.reward, 
    streak: result.streak, 
    canClaim: true, 
    hoursLeft: 0,
    color: env.embedHex 
  })] });
  return;
}

case 'weeklycheckin': {
  await deferReply();
  const economyService = context.economyService;
  const username = sourceChannel.guild?.members.cache.get(userId)?.user?.username || 'Unknown';
  const result = await economyService.weeklyCheckIn(userId, username);
  
  if (!result) {
    await editReply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '❌ Error', description: 'Gagal melakukan weekly check-in.' })] });
    return;
  }

  if (!result.canCheckIn) {
    await editReply({ embeds: [createWeeklyCheckInEmbed({ 
      reward: 0, 
      streak: 0, 
      canClaim: false, 
      daysLeft: result.daysLeft,
      color: env.embedHex 
    })] });
    return;
  }

  await editReply({ embeds: [createWeeklyCheckInEmbed({ 
    reward: result.reward, 
    streak: result.streak, 
    canClaim: true, 
    daysLeft: 0,
    color: env.embedHex 
  })] });
  return;
}

case 'work': {
  await deferReply();
  const economyService = context.economyService;
  const username = sourceChannel.guild?.members.cache.get(userId)?.user?.username || 'Unknown';
  const result = await economyService.work(userId, username);
  
  if (!result) {
    await editReply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '❌ Error', description: 'Gagal bekerja.' })] });
    return;
  }

  if (!result.canWork) {
    await editReply({ embeds: [createStatusEmbed({ 
      color: 0xFF6B6B, 
      title: '⏳ Cooldown Bekerja', 
      description: `Kamu masih capek! Bisa bekerja lagi dalam ${result.minutesLeft} menit.` 
    })] });
    return;
  }

  await editReply({ embeds: [createWorkRewardEmbed({ 
    jobName: result.jobName, 
    reward: result.reward, 
    newLevel: result.newLevel,
    totalWorked: result.user.totalWorked,
    color: env.embedHex 
  })] });
  return;
}

case 'beg': {
  await deferReply();
  const economyService = context.economyService;
  const username = sourceChannel.guild?.members.cache.get(userId)?.user?.username || 'Unknown';
  const result = await economyService.beg(userId, username);
  
  if (!result) {
    await editReply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '❌ Error', description: 'Gagal minta-minta.' })] });
    return;
  }

  if (!result.canBeg) {
    await editReply({ embeds: [createStatusEmbed({ 
      color: 0xFF6B6B, 
      title: '⏳ Cooldown Minta-minta', 
      description: `Malu ah! Bisa minta lagi dalam ${result.minutesLeft} menit.` 
    })] });
    return;
  }

  await editReply({ embeds: [createBegRewardEmbed({ 
    reward: result.reward,
    totalBegged: result.user.totalBegged,
    color: env.embedHex 
  })] });
  return;
}

case 'race': {
  await deferReply();
  const economyService = context.economyService;
  const username = sourceChannel.guild?.members.cache.get(userId)?.user?.username || 'Unknown';
  const result = await economyService.race(userId, username);
  
  if (!result) {
    await editReply({ embeds: [createStatusEmbed({ color: env.embedHex, title: '❌ Error', description: 'Gagal balapan.' })] });
    return;
  }

  if (!result.canRace) {
    if (result.minutesLeft) {
      await editReply({ embeds: [createStatusEmbed({ 
        color: 0xFF6B6B, 
        title: '⏳ Cooldown Balapan', 
        description: `Kamu masih lelah! Bisa balapan lagi dalam ${result.minutesLeft} menit.` 
      })] });
    } else {
      await editReply({ embeds: [createStatusEmbed({ 
        color: 0xFF6B6B, 
        title: '🚗 Tidak Ada Mobil', 
        description: result.reason 
      })] });
    }
    return;
  }

  await editReply({ embeds: [createRaceResultEmbed({ 
    won: result.won,
    reward: result.reward,
    totalWins: result.totalWins,
    totalRaces: result.totalRaces,
    color: env.embedHex 
  })] });
  return;
}

case 'shop': {
  await deferReply();
  const action = input.args.shopAction || interaction?.options?.getString('action');
  const carId = input.args.carId || interaction?.options?.getString('car');
  const economyService = context.economyService;
  const username = sourceChannel.guild?.members.cache.get(userId)?.user?.username || 'Unknown';

  if (action === 'list') {
    const cars = economyService.getCarsList();
    await editReply({ embeds: [createShopEmbed({ cars, color: env.embedHex })] });
    return;
  }

  if (action === 'buy') {
    if (!carId) {
      await editReply({ embeds: [createStatusEmbed({ 
        color: env.embedHex, 
        title: '❌ Format Salah', 
        description: 'Format: `/shop buy [car_id]`\nContoh: `/shop buy civic`' 
      })] });
      return;
    }

    const result = await economyService.buyCar(userId, username, carId);
    
    if (!result.canBuy) {
      await editReply({ embeds: [createStatusEmbed({ 
        color: 0xFF6B6B, 
        title: '❌ Pembelian Gagal', 
        description: result.reason 
      })] });
      return;
    }

    await editReply({ embeds: [createBuyCarEmbed({ 
      carName: result.car,
      price: economyService.getCarsList()[carId].price,
      newBalance: result.newBalance,
      color: env.embedHex 
    })] });
    return;
  }

  await editReply({ embeds: [createStatusEmbed({ 
    color: env.embedHex, 
    title: '❌ Action Tidak Valid', 
    description: 'Pilih: `list` atau `buy`' 
  })] });
  return;
}
