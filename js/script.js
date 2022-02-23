const bar = document.getElementById('js-progressbar')
function loadFileAsText() {
  $('#File_selection, #help').hide()
  $('#js-progressbar').show()
  $('#status-text').text('ファイルを読み込み中')
  bar.value += 20
  const fileToLoad = document.getElementById('fileToLoad').files[0]

  const fileReader = new FileReader()
  fileReader.onload = function (fileLoadedEvent) {
    const textFromFileLoaded = fileLoadedEvent.target.result
    window.file_text = textFromFileLoaded
    GetGata(textFromFileLoaded)
  }

  fileReader.readAsText(fileToLoad, 'UTF-8')
}
function GetGata(got_text) {
  $('#status-text').text('ファイルを分析中')
  bar.value += 20
  const lines = got_text.split('\n')

  let message = 0
  let text = 0
  let stamp = 0
  let image = 0
  let movie = 0

  const users = {}
  const message_data = {}

  const date = {}
  const diary = {}
  let Over_1000_days = 0
  let line_date
  let lastUser

  // 分析
  for (let line = 0; line < lines.length; line++) {
    const regex_date = new RegExp(/^\d\d\d\d[/]\d?\d[/]\d?\d[(].[)]/)
    if (regex_date.test(lines[line])) {
      line_date = lines[line]
      message_data[line_date] = {}
    }
    const regex = new RegExp(/^\d?\d:\d\d/)
    if (regex.test(lines[line])) {
      message++
      const name = lines[line].split(/\s/)[1]
      message_data[line_date][lines[line].match(regex)[0]] = {
        user: name,
        contents: lines[line],
      }
      if (users[name] == null) {
        users[name] = {}
        users[name]['message'] = 0
        users[name]['mention'] = 0
        users[name]['continuously'] = []
        users[name]['join'] = line_date.slice(0, -3)
        users[name]['contents'] = {}
        users[name]['contents']['text'] = 0
        users[name]['contents']['image'] = 0
        users[name]['contents']['movie'] = 0
        users[name]['contents']['stamp'] = 0
      }
      if (date[line_date] == null) {
        date[line_date] = 0
      }
      date[line_date]++
      users[name]['message']++
      if (lines[line].indexOf('[写真]') !== -1) {
        image++
        users[name]['contents']['image']++
      } else if (lines[line].indexOf('[動画]') !== -1) {
        movie++
        users[name]['contents']['movie']++
      } else if (lines[line].indexOf('[スタンプ]') !== -1) {
        stamp++
        users[name]['contents']['stamp']++
      } else {
        text++
        users[name]['contents']['text']++
        const regex_diary = new RegExp(/日記:\d?\d月\d?\d日/)
        if (regex_diary.test(lines[line])) {
          const regex_date_ja = new RegExp(/\d?\d月\d?\d日/)
          diary_date = lines[line].match(regex_date_ja)
          let add_line = 0
          while (true) {
            add_line++
            if (lines[line + add_line] == null) {
              break
            } else if (lines[line + add_line].match(regex)) {
              break
            } else {
              if (diary[diary_date] == null) {
                diary[diary_date] = ''
              }
              diary[diary_date] += lines[line + add_line] + '\n'
            }
          }
          $('#diary_tbody').append(
            `<tr><td>${diary_date}</td><td>${diary[diary_date]}</td></tr>`
          )
        }
      }
      if (lastUser == name) {
        users[name]['continuously'][users[name]['continuously'].length - 1]++
      } else {
        users[name]['continuously'].push(1)
      }
      lastUser = name
    }
  }
  //1000を超えた日をカウント
  const date_keys = Object.keys(date)
  for (let key in date_keys) {
    if (date[date_keys[key]] > 1000) {
      Over_1000_days++
    }
  }
  //メンションのカウント
  for (const user in users) {
    if (Object.hasOwnProperty.call(users, user)) {
      const element = users[user]
      const mention = window.file_text.split('@' + user).length - 1
      element.mention = mention
    }
  }

  $('#status-text').text('完了')
  bar.value = 100
  $('#result, #search-box, #daily-data, #diary, #over_1000_days').show()
  $('#js-progressbar').hide()
  $('#result_title').text(
    `総メッセージ数${message} | テキスト数${text} | 画像数${image} | 動画数${movie} | スタンプ数${stamp}`
  )
  $('#over_1000_days').text(`1日に1000メッセージを超えた日: ${Over_1000_days}`)
  const keys = Object.keys(users)
  for (let i = 0; i < keys.length; i++) {
    const name = keys[i]
    const user = users[keys[i]]
    $('#result_tbody').append(
      `<tr><td>${name}</td><td>${user['message']}</td><td>${user['contents']['text']}</td><td>${user['contents']['image']}</td><td>${user['contents']['movie']}</td><td>${user['contents']['stamp']}</td><td>${user['mention']}</td><td>${Math.max.apply(Math, user['continuously'])}</td><td>${user['join']}</td></tr>`
    )
  }
  $(document).ready(function () {
    $('#result_table').DataTable({
      // 日本語表示
      language: {
        url: 'http://cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Japanese.json',
      },
      displayLength: 50,
      order: [6, 'desc'],
    })
    $('#diary_table').DataTable({
      // 日本語表示
      language: {
        url: 'http://cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Japanese.json',
      },
      displayLength: 50,
    })
  })
  createDailyChart(date)
}
$('#search-button').on('click', function () {
  const text = window.file_text
  const targetStr = $('#search').val()
  const count = (text.match(new RegExp(targetStr, 'g')) || []).length
  alert(`検索結果: ${count}`)
})

function createDailyChart(date) {
  var date_keys = Object.keys(date)
  var days = []
  var numbers = []
  for (var i = 0; i < date_keys.length; i++) {
    var day = date_keys[i]
    var n = date[date_keys[i]]
    days.push(day)
    numbers.push(n)
  }
  var sum = 0
  numbers.forEach((v) => (sum += v))
  var Average_value = sum / numbers.length
  $('#average_value').text(`1日の平均: ${Average_value}`)
  var ctx = document.getElementById('daily-chart')
  var myLineChart = new Chart(ctx, {
    // グラフの種類：折れ線グラフを指定
    type: 'line',
    data: {
      // x軸の各メモリ
      labels: days,
      datasets: [
        {
          label: 'メッセージ数',
          data: numbers,
          borderColor: '#0067c0',
          backgroundColor: '#00000000',
          lineTension: 0,
        },
      ],
    },
    options: {
      plugins: {
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            mode: 'xy',
          },
        },
      },
    },
  })
}
function getParam(name, url) {
  if (!url) url = window.location.href
  const name = name.replace(/[\[\]]/g, '\\$&')
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}
if (location.hash) {
  const url = location.hash.slice(1)
  $('#File_selection, #help').hide()
  $(function () {
    const myAjax = {
      init: function () {
        $.ajax({
          url: url, //or path of your file
          async: true,
          timeout: 10000,
          success: function (data) {
            window.file_text = data
            GetGata(data)
          },
          error: function (XMLHttpRequest, textStatus, errorThrown) {
            alert('error!!!')
            console.log('XMLHttpRequest : ' + XMLHttpRequest.status)
            console.log('textStatus     : ' + textStatus)
            console.log('errorThrown    : ' + errorThrown.message)
          },
        })
      },
    }
    myAjax.init()
  })
}
