require('dotenv').config()
const discord = require('discord.js');
const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, MessageFlags } = discord;
const axios = require('axios');
const cheerio = require('cheerio');

let rofl = '💰 Максимальный баланс';

let usageNumber = 0;

const commands = [
    {
        name: 'dox',
        description: 'Dox anyone!!',
        options: [
            {
                name: 'персонаж',
                description: 'Название персонажа',
                type: 3, // Тип STRING
                required: true,
            },
        ],
    },
];

const rest = new REST().setToken(process.env.BOT_TOKEN);

const slashRegister = async () => {
    try {
        await rest.put(Routes.applicationCommands('1347568073221345310'), {
            body: commands,
        });
        console.log('Команда добавлена');
    } catch (error) {
        console.error('Ошибка при регистрации команд:', error);
    }
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
    ],
});

client.login(process.env.BOT_TOKEN).then(() => console.log('Бот включен'));

slashRegister();


client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'dox') {
        const characterName = interaction.options.getString('персонаж');

        if (!characterName || characterName.trim() === '') {
            await interaction.reply({ content: 'Пожалуйста, укажите имя персонажа.', flags: MessageFlags.Ephemeral });
            return;
        }

        const url = `https://stalcrafthq.com/characters/RU/${encodeURIComponent(characterName)}`;
        try {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);

            let avatarURL = null;

            let name = $('h5.mud-typography.mud-typography-h5.click-select').text();
            const factionElement = $('h5.mud-typography.mud-typography-h5.faction-color');

            if (!factionElement.length) {
                await interaction.reply({ content: 'Фракция не найдена.', flags: MessageFlags.Ephemeral });
                return;
            }

            const factionClasses = factionElement.attr('class');
            const faction = factionClasses.split(' ').find(cls => 
                cls === 'freedom' || cls === 'duty' || cls === 'covenant' || cls === 'mercenaries'
            );

            const factionTranslations = {
                freedom: 'Свобода',
                duty: 'Рубеж',
                covenant: 'Завет',
                mercenaries: 'Наемники',
            };
            const cardColor = {
                Свобода: 5763719,
                Рубеж: 15548997,
                Завет: 7419530,
                Наемники: 3447003,
            };
            const factionName = factionTranslations[faction] || 'Неизвестно';

            const characterStatsKd = $('span.character-stat').toArray();

            let clanTagUnref = 'Не в клане';
            const clanTagElement = $('.mud-link.mud-info-text.mud-typography-inherit');
            if (clanTagElement.length > 0) {
                clanTagUnref = clanTagElement.text().trim();
            }

            let clanPosition = '';
            const clanPositionElement = $('p.mud-typography.mud-typography-body1').toArray()[6];
            if (clanPositionElement) {
                const clanPositionText = $(clanPositionElement).text().trim();
                switch (clanPositionText) {
                    case 'Leader of':
                        clanPosition = 'Лидер';
                        break;
                    case 'Officer of':
                        clanPosition = 'Офицер';
                        break;
                    case 'Sergeant of':
                        clanPosition = 'Сержант';
                        break;
                    case 'Recruit in':
                        clanPosition = 'Рекрут';
                        break;
                    case 'Colonel in':
                        clanPosition = 'Полковник';
                        break;
                }
            }

            if (characterStatsKd.length >= 20) {
                const killsElement = characterStatsKd[characterStatsKd.length - 20];
                const killsText = $(killsElement).text().trim();
                const deathElement = characterStatsKd[characterStatsKd.length - 19];
                const deathText = $(deathElement).text().trim();

                const killsOpenEl = characterStatsKd[0];
                const killsTextOp = $(killsOpenEl).text().trim();
                const deathOpenEl = characterStatsKd[32];
                const deathTextOp = $(deathOpenEl).text().trim();

                const peopleDamageDealt = characterStatsKd[35];
                const damageDealtText = $(peopleDamageDealt).text().trim();
                const peopleDamageGot = characterStatsKd[36];
                const damageGotText = $(peopleDamageGot).text().trim();

                const totalHits = characterStatsKd[41];
                const totalHitsText = $(totalHits).text().trim();
                const headHits = characterStatsKd[42];
                const headHitsText = $(headHits).text().trim();

                const kills = parseFloat(killsText.replace(/,/g, ''));
                const deaths = parseFloat(deathText.replace(/,/g, ''));
                const killsOpen = parseFloat(killsTextOp.replace(/,/g, ''));
                const deathsOpen = parseFloat(deathTextOp.replace(/,/g, ''));
                const peopleDamage = parseFloat(damageDealtText.replace(/,/g, ''));
                const peopleDamageGott = parseFloat(damageGotText.replace(/,/g, ''));
                const totalfloat = parseFloat(totalHitsText.replace(/,/g, ''));
                const totalHeadFloat = parseFloat(headHitsText.replace(/,/g, ''));

                if (deaths === 0 || deathsOpen === 0) {
                    console.log('Ошибка: deaths равно нулю, невозможно вычислить K/D.');
                    return;
                }

                const formattedKills = kills.toLocaleString('ru-RU');
                const formattedDeaths = deaths.toLocaleString('ru-RU');
                const formattedKillsOpen = killsOpen.toLocaleString('ru-RU');
                const formattedDeathsOpen = deathsOpen.toLocaleString('ru-RU');
                const formattedDamageDealt = peopleDamage.toLocaleString('ru-RU');
                const formattedDamageGot = peopleDamageGott.toLocaleString('ru-RU');

                const kdRatio = (kills / deaths).toFixed(2);
                const kdRatioOpen = (killsOpen / deathsOpen).toFixed(2);
                const kdDamage = (peopleDamage / peopleDamageGott).toFixed(2);
                const kdHead = ((totalHeadFloat / totalfloat) * 100).toFixed(2);

                const firstEntryElement = $('span.inline-timestamp.no-highlight.character-stat');
                let firstEntryTimestamp = 'Неизвестно';
                if (firstEntryElement.length) {
                    const firstEntryString = firstEntryElement.text();
                    const firstEntryDate = new Date(firstEntryString);
                    const unixTimestamp = Math.floor(firstEntryDate.getTime() / 1000);
                    firstEntryTimestamp = `<t:${unixTimestamp}:F>`;
                }

                const timeplayedText = $('span.inline-timespan.no-highlight.character-stat').text();
                const timeplayed = timeplayedText.includes('hours, ') ? timeplayedText.split('hours, ')[0] : 'Неизвестно';

                if (interaction.inGuild()) {
                    const guild = interaction.guild;
                    console.log('in guild!')
                    
                    console.log(guild)
                    if (guild) {
                        
                        const guild = interaction.guild;
                        await guild.members.fetch();
                        //console.log(botPermissions)
                        const member = guild.members.cache.find(member => 
                            member.nickname?.replace(/\[.*?\]\s*/, '').replace(/\(.*?\)\s*/, '').toLowerCase() === name.toLowerCase() || 
                            member.user.username.replace(/\[.*?\]\s*/, '').replace(/\(.*?\)\s*/, '').toLowerCase() === name.toLowerCase()
                        );
                        
                        if (member) {
                            //console.log(member)
                            console.log('found member')
                            avatarURL = member.user.displayAvatarURL({ format: 'png', dynamic: true, size: 256 });
                        } else {
                            console.log('no member')
                        }
                    } else {
                        console.log('dont have acess!')
                    }
                    }
                const maxMoneyUnref = $(characterStatsKd[88]).text().trim();
                const numericString = maxMoneyUnref.replace(/[^0-9]/g, '');
                const number = parseFloat(numericString);
                const formattedNumber = new Intl.NumberFormat('ru-RU').format(number);

                const skupMoney = $(characterStatsKd[84]).text().trim();
                const skupMoney2 = skupMoney.replace(/[^0-9]/g, '');
                const skupMoney3 = new Intl.NumberFormat('ru-RU').format(skupMoney2);

                const questMoney = $(characterStatsKd[85]).text().trim();
                const questMoney2 = questMoney.replace(/[^0-9]/g, '');
                const questMoney3 = new Intl.NumberFormat('ru-RU').format(questMoney2);

                const pakiMoney = $(characterStatsKd[79]).text().trim();
                const pakiMoney2 = pakiMoney.replace(/[^0-9]/g, '');
                const pakiMoney3 = new Intl.NumberFormat('ru-RU').format(pakiMoney2);

                const artifacts = $(characterStatsKd[62]).text().trim();
                const artifacts1 = artifacts.replace(/[^0-9]/g, '');
                const artifacts2 = new Intl.NumberFormat('ru-RU').format(artifacts1);

                const signals = $(characterStatsKd[65]).text().trim();
                const signals1 = signals.replace(/[^0-9]/g, '');
                const signals2 = new Intl.NumberFormat('ru-RU').format(signals1);

                const prikopi = $(characterStatsKd[61]).text().trim();
                const prikopi1 = prikopi.replace(/[^0-9]/g, '');
                const prikopi2 = new Intl.NumberFormat('ru-RU').format(prikopi1);

                if (name === 'Wqertid') {
                    rofl = 'Хуёв в жопе'
                } else if (name === 'Бебрятинка') {
                    name = 'Нубас бебрррра';
                } else if (name === 'Sadvice' || name === 'ToxicPrince' || name === 'ЭмОбОй' || name === 'Дванон' || name === 'Максимка_зхс')  {
                    rofl = 'Хуёв в жопе'
                }
                

                const embed = new EmbedBuilder()
                    .setTitle(`**${name}**`)
                    .setDescription(`Фракция: ${factionName}`)
                    .setColor(cardColor[factionName])
                    .setTimestamp()
                    .addFields(
                        { name: '⏳ Времени в игре', value: `**${timeplayed}** часов`, inline: true },
                        { name: '📅 Первый вход', value: `${firstEntryTimestamp}`, inline: true },
                        { name: '🎯 K / D в Сессии', value: `${kdRatio}\n${formattedKills} / ${formattedDeaths}` },
                        { name: '🔫 K / D в Опене', value: `${kdRatioOpen}\n${formattedKillsOpen} / ${formattedDeathsOpen}`, inline: true },
                        { name: '⚔️ D / R DMG соотношение', value: `${kdDamage}\n${formattedDamageDealt} / ${formattedDamageGot}` },
                        { name: '🎯 Точность', value: `HS ${kdHead}%\n${totalHitsText} / ${headHitsText}`, inline: false },
                        { name: '🏰 В клане', value: `${clanPosition} ${clanTagUnref}` },
                        { name: `${rofl}`, value: `${formattedNumber}`, inline: true },
                        { name: '🛒 Скупщик / 📜 Квесты / 📦 Паки', value: `${skupMoney3} / ${questMoney3} / ${pakiMoney3}` },
                        { name: '🏺 Артефаты / 📡 Сигналы / ⚒️ Прикопы', value: `${artifacts2} / ${signals2} / ${prikopi2}` },
                        
                    )
                    .setFooter({ text: '🔄 Информация обновлена' })
                    
                    if (avatarURL) {
                        embed.setThumbnail(avatarURL);
                    }

                    usageNumber += 1;
                    console.log('Всего запросов: ' + usageNumber);
                    console.log(interaction.user.username)
                    console.log('AKA ' + interaction.user.globalName)
                    console.log('Задоксил ' +name)
                    console.log(interaction.user)
                
                        
                    
                await interaction.reply({ embeds: [embed] });
                rofl = '💰 Максимальный баланс';
            } else {
                await interaction.reply({ content: 'Недостаточно данных для отображения.', flags: MessageFlags.Ephemeral });
            }
        }catch (error) {
            if (error.response && error.response.status === 404) {
                await interaction.reply({ content: 'Персонаж не найден. Проверьте правильность имени.', flags: MessageFlags.Ephemeral });
            } else {
                console.error('Ошибка при запросе данных:', error);
                await interaction.reply({ content: 'Произошла ошибка при получении данных.', flags: MessageFlags.Ephemeral });
            }
        }
    }
});