require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const DB_FILE = './database.json';

// ዳታቤዝ የማንበቢያ ፈንክሽን
function readDB() {
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, stats: { totalGames: 0 } }));
    return JSON.parse(fs.readFileSync(DB_FILE));
}

// ዳታቤዝ መጻፊያ ፈንክሽን
function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// አዲስ ተጠቃሚ ሲመዘገብ የ10 ብር ቦነስ የሚሰጥበት አሰራር
function checkUser(ctx) {
    const db = readDB();
    const userId = ctx.from.id;
    let isNewUser = false;

    if (!db.users[userId]) {
        db.users[userId] = {
            username: ctx.from.username || "No_Username",
            balance: 10, // ለመጀመሪያ ጊዜ ለሚመጡ ከስተመሮች የተዘጋጀ የ10 ብር ቦነስ
            status: "active",
            joinedAt: new Date().toISOString(),
            state: "active"
        };
        isNewUser = true;
        writeDB(db);
    }
    return { user: db.users[userId], isNewUser };
}

// የቦቱ መጀመሪያ (/start)
bot.start((ctx) => {
    const { user, isNewUser } = checkUser(ctx);
    
    let welcomeMessage = `እንኳን ወደ Ethio Bingo Game በደህና መጡ! 🇪🇹\n\n`;
    if (isNewUser) {
        welcomeMessage += `🎁 እንኳን ደስ አለዎት! በቴሌግራም አካውንትዎ በተሳካ ሁኔታ ስለተመዘገቡ የ 10 ብር መጀመሪያ ቦነስ በዋሌትዎ ላይ ተጨምሯል!\n\n`;
    }
    welcomeMessage += `ሙሉ በሙሉ አውቶማቲክ በሆነው አዲስ ሲስተማችን ይጫወቱ፣ ያሸንፉ!`;

    ctx.reply(welcomeMessage, 
        Markup.keyboard([
            ['🎮 ቢንጎ ተጫወት', '💰 ዋሌት (Wallet)'],
            ['📥 ገንዘብ አስገባ (Deposit)', '📤 ገንዘብ አውጣ (Withdraw)'],
            ['ℹ️ መረጃና መመሪያ']
        ]).resize()
    );
});

// የዋሌት ሁኔታ ማሳያ
bot.hears('💰 ዋሌት (Wallet)', (ctx) => {
    const { user } = checkUser(ctx);
    ctx.reply(`📊 የሂሳብዎ ሁኔታ (Wallet Summary):\n\n💵 ቀሪ ባላንስ: ${user.balance} ብር\n👤 ተጠቃሚ: @${ctx.from.username || 'የለዎትም'}`);
});

// የቢንጎ መመሪያ
bot.hears('ℹ️ መረጃና መመሪያ', (ctx) => {
    ctx.reply(`💡 የEthio Bingo አጨዋወት መመሪያ፦\n\n1. 'ቢንጎ ተጫወት' የሚለውን በተን ይጫኑ።\n2. ካርታ መርጠው መጫወት ይችላሉ (ከባላንስዎ ይቆረጣል)።\n3. ቁጥሮች በሲስተሙ ፍጹም ራንደምሊ (Randomly) ይወጣሉ።\n4. ያሸነፉትን ገንዘብ ወዲያውኑ ማውጣት ይችላሉ።`);
});

// ገንዘብ ማስገቢያ (Deposit) መጫኛ
bot.hears('📥 ገንዘብ አስገባ (Deposit)', (ctx) => {
    checkUser(ctx);
    ctx.reply(`💳 እባክዎ የክፍያ አማራጭ ይምረጡ፦`,
        Markup.inlineKeyboard([
            [Markup.button.callback('Telebirr (ቴሌብር)', 'dep_telebirr')],
            [Markup.button.callback('CBE (ንግድ ባንክ)', 'dep_cbe')]
        ])
    );
});

// የቴሌብር መረጃ ማሳያ
bot.action('dep_telebirr', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(`📲 የቴሌብር ክፍያ መረጃ፦\n\n🔢 ቁጥር: ${process.env.TELEBIRR_NUMBER || '0944123180'}\n👤 ስም: ${process.env.TELEBIRR_NAME || 'Enyachew Amerga'}\n\n⚠️ መመሪያ፡ ክፍያውን ከፈጸሙ በኋላ የክፍያውን ማረጋገጫ ስክሪንሾት (Screenshot) እዚህ ላይ ይላኩት። ቦቱ አጣርቶ ባላንስዎ ላይ ይጨምራል።`);
});

// የንግድ ባንክ መረጃ ማሳያ
bot.action('dep_cbe', (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(`🏦 የንግድ ባንክ ክፍያ መረጃ፦\n\n🔢 አካውንት: ${process.env.CBE_ACCOUNT || '1000682528641'}\n👤 ስም: ${process.env.CBE_NAME || 'Enyachew Amerga'}\n\n⚠️ መመሪያ፡ ክፍያውን ከፈጸሙ በኋላ የክፍያውን ማረጋገጫ ስክሪንሾት (Screenshot) እዚህ ላይ ይላኩት። ቦቱ አጣርቶ ባላንስዎ ላይ ይጨምራል።`);
});

// ተጠቃሚ ስክሪንሾት ሲልክ ለአድሚን ማስተላለፊያ
bot.on('photo', async (ctx) => {
    const { user } = checkUser(ctx);
    ctx.reply('🔄 የማረጋገጫ ስክሪንሾትዎ ደርሶናል። ትክክለኛነቱ በአድሚን ተጣርቶ ወዲያውኑ ወደ ዋሌትዎ ይጨመራል...');
    
    // ለአድሚኑ መረጃ ማስተላለፊያ
    ctx.reply(`ℹ️ አዲስ የዲፖዚት ጥያቄ ከ @${user.username} ደርሷል። (ክፍያውን ካረጋገጡ በኋላ በአድሚን ፓናል ያጽድቁት)`);
});

// ገንዘብ ማውጫ (Withdraw) መጫኛ
bot.hears('📤 ገንዘብ አውጣ (Withdraw)', (ctx) => {
    const { user } = checkUser(ctx);
    if (user.balance <= 0) {
        return ctx.reply('❌ ይቅርታ፣ በቂ ባላንስ የለዎትም። (Insufficient Balance)');
    }
    ctx.reply('💵 ማውጣት የሚፈልጉትን የገንዘብ መጠን በቁጥር ብቻ ይጻፉ (ምሳሌ፡ 200)፦');
    
    const db = readDB();
    db.users[ctx.from.id].state = 'awaiting_withdraw_amount';
    writeDB(db);
});

// የቴክስት መልዕክቶች መቆጣጠሪያ
bot.on('text', (ctx) => {
    const db = readDB();
    const userId = ctx.from.id;
    const user = db.users[userId];

    if (!user) return;

    if (user.state === 'awaiting_withdraw_amount') {
        const amount = parseInt(ctx.message.text);
        if (isNaN(amount) || amount <= 0) {
            return ctx.reply('❌ እባክዎ ትክክለኛ የገንዘብ መጠን በቁጥር ብቻ ያስገቡ።');
        }
        if (amount > user.balance) {
            return ctx.reply(`❌ ይቅርታ፣ በቂ ባላንስ የለዎትም። ቀሪ ሂሳብዎ ${user.balance} ብር ነው።`);
        }

        user.withdrawAmount = amount;
        user.state = 'awaiting_withdraw_method';
        writeDB(db);

        ctx.reply('🏦 ገንዘቡ የሚላክበትን የባንክ አይነት ይምረጡ፦',
            Markup.inlineKeyboard([
                [Markup.button.callback('Telebirr', 'w_telebirr'), Markup.button.callback('CBE (ንግድ ባንክ)', 'w_cbe')]
            ])
        );
    } else if (user.state === 'awaiting_account_details') {
        const accountInfo = ctx.message.text;
        const amount = user.withdrawAmount;

        user.balance -= amount;
        user.state = 'active';
        writeDB(db);

        ctx.reply('⏳ የዊዝድሮው ጥያቄዎ በተሳካ ሁኔታ ተመዝግቧል። በአሁኑ ሰዓት "በሂደት ላይ ነው (Processing)"። አድሚኑ ሲያረጋግጥ መልዕክት ይደርስዎታል።');

        // ለአድሚኑ የሚላክ ማስታወቂያ
        ctx.reply(`🚨 **አዲስ የወጪ (Withdraw) ጥያቄ** 🚨\n\n👤 ተጠቃሚ: @${user.username}\n💵 መጠን: ${amount} ብር\n🏦 የክፍያ መንገድ: ${user.withdrawMethod}\n🔢 ሂሳብ ቁጥር: ${accountInfo}\n\nአድሚን @${process.env.ADMIN_USERNAME || 'enyachew_19'} ክፍያውን ፈጽመው ሲያበቁ ያጽድቁት።`);
    }
});

// የዊዝድሮው ባንክ ምርጫ
bot.action(['w_telebirr', 'w_cbe'], (ctx) => {
    ctx.answerCbQuery();
    const method = ctx.match === 'w_telebirr' ? 'Telebirr' : 'CBE';
    const db = readDB();
    db.users[ctx.from.id].withdrawMethod = method;
    db.users[ctx.from.id].state = 'awaiting_account_details';
    writeDB(db);

    ctx.reply(`🔢 እባክዎ ገንዘብ የሚቀበሉበትን የ ${method} ስልክ ቁጥር ወይም አካውንት ያስገቡልን፦`);
});

bot.launch().then(() => console.log('Ethio Bingo Game Bot Is Running!'));
