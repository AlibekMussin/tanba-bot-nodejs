require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { Telegraf } = require('telegraf')
// const fs = require('fs');
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

bot.start((ctx) => ctx.reply('Добрый день. Для поиска животного в базе ИС Танба, введите команду \n/search номер_чипа\n\n Пример: /search 398020000021894'));

// bot.help((ctx) => ctx.reply('Send me a message and I will reply!'))

// bot.command('search', (ctx) => {
//       ctx.reply('Делаем поиск...');
//       console.log(ctx.message.text);
//     });

bot.command('search', async (ctx) => {
  ctx.reply('Делаем поиск в танбе...');
  
  const searchText = ctx.message.text.split(" ")[1];
  
  if ((searchText!='') && (searchText!=undefined))
  {
    if (searchText.length<6)
  {
    ctx.reply('Слишком мало символов для поиска');
  }
  else {

    try {
      // Получение данных по урлу
      const url = `https://tanba.kezekte.kz/ru/reestr-tanba-public/animal/list?flPassportNumber=&flInzh=${searchText}&flName=&flAccountName=&flPersonFio=&flCreateAt_from=&flCreateAt_to=`;

      axios.get(url).then(response => {

        const $ = cheerio.load(response.data);
        const tableRows = $('table.table tbody tr');
        const animals = tableRows.map((_, row) => {
          const tds = $(row).find('td');
          const markingPlace = $(tds[13]).text()+', '+$(tds[11]).text()+' '+$(tds[10]).text();
          return {
            inzh: $(tds[0]).text(),
            type: $(tds[1]).text(),
            name: $(tds[2]).text(),
            gender: $(tds[3]).text(),
            breed: $(tds[4]).text(),
            passportNumber: $(tds[5]).text(),
            markingPlace: markingPlace,
          };
        }).get();
        console.log(animals.length);
        let message = 'Ваши данные:\n\n';
        message += 'Тип животного\tКличка\tПорода\tМесто маркировки\n';
        message += '---------------------------------------------------------------------------------------------\n';

        for (let i = 0; i < animals.length; i++) {
          let animal = animals[i];
          if (animal.inzh == 'Нет записей')
          {
            message +=animal.inzh;
          }
          else
          message += animal.type + '\t' + animal.name + '\t' +  animal.breed + '\t' + animal.markingPlace +'\t ИНЖ: ' +animal.inzh  + '\n\n';
        }


        const regex = /<div class="mt-3"><div class="text-right text-nowrap"><span><small>Всего записей<\/small> (\d+)<\/span>/;
        const matches = response.data.match(regex);
        if (matches) {
          const count = matches[1];
          message += '---------------------------------------------------------------------------------------------\n';
          message += `Всего найдено записей: ${count}. В ответе показываются только первые 15. Чтобы уменьшить область поиска, напишите ИНЖ более точно`;
          // console.log(`Найдено ${count} записей`);
        } else {
          // console.log('Не удалось получить количество записей');
        }
        ctx.reply(message);
        

      }).catch(error => {
        console.log(error);
      });
      
    } catch (error) {
      console.error(error);
      ctx.reply('Ошибка при загрузке файла');
    }
   }
  }
  else
    ctx.reply('Вы не написали номер ИНЖ для поиска попробуйте еще раз');
});

bot.launch()
