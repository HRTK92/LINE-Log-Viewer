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
    GetData(textFromFileLoaded)
  }

  fileReader.readAsText(fileToLoad, 'UTF-8')
}
function GetData(got_text) {
  $('#status-text').text('ファイルを分析中')
  bar.value += 20
  const lines = got_text.split('\n')

  let statistics = { message: 0, text: 0, stamp: 0, image: 0, video: 0, call: 0 }

  const users = {}
  const message_data = {}
  const date = {}
  const diary = {}
  const call = []
  let LastStartedCall

  let Over_1000_days = 0
  let line_date
  let lastUser

  /*分析*/
  for (let line = 0; line < lines.length; line++) {
    const regex_date = new RegExp(/^\d\d\d\d[/]\d?\d[/]\d?\d[(].[)]/)
    if (regex_date.test(lines[line])) {
      line_date = lines[line]
      message_data[line_date] = {}
    }
    const regex = new RegExp(/^\d?\d:\d\d/)
    if (regex.test(lines[line])) {
      statistics['message']++

      const SentTime = lines[line].split(/\s/)[0]
      const name = lines[line].split(/\s/)[1]

      message_data[line_date][lines[line].match(regex)[0]] = {
        user: name,
        contents: lines[line],
      }

      let user
      if (users[name] == null) {
        users[name] = {}
        user = users[name]
        user['message'] = 0
        user['mention'] = 0
        user['continuously'] = []
        user['join'] = line_date.slice(0, -3)
        user['contents'] = {}
        user['contents']['text'] = 0
        user['contents']['image'] = 0
        user['contents']['movie'] = 0
        user['contents']['stamp'] = 0
        user['contents']['call'] = 0
      } else {
        user = users[name]
      }
      if (date[line_date] == null) {
        date[line_date] = 0
      }

      date[line_date]++
      user['message']++

      if (lines[line].indexOf('[写真]') !== -1) {
        statistics['image']++
        user['contents']['image']++
      } else if (lines[line].indexOf('[動画]') !== -1) {
        statistics['video']++
        user['contents']['movie']++
      } else if (lines[line].indexOf('[スタンプ]') !== -1) {
        statistics['stamp']++
        user['contents']['stamp']++
      } else if (lines[line].indexOf('グループ音声通話が開始されました。') !== -1) {
        user['contents']['call']++
        LastStartedCall = line_date.slice(0, -3) + ' ' + SentTime
      } else if (lines[line].indexOf('グループ通話が終了しました。') !== -1) {
        call.push([LastStartedCall, line_date.slice(0, -3) + ' ' + SentTime])
        LastStartedCall = null
      } else {
        statistics['text']++
        user['contents']['text']++

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

      /*連続発言数*/
      if (lastUser == name) {
        user['continuously'][user['continuously'].length - 1]++
      } else {
        user['continuously'].push(1)
      }
      lastUser = name

    }
  }

  /*1000を超えた日をカウント*/
  const date_keys = Object.keys(date)
  for (let key in date_keys) {
    if (date[date_keys[key]] > 1000) {
      Over_1000_days++
    }
  }

  /*メンションのカウント*/
  for (const user in users) {
    if (Object.hasOwnProperty.call(users, user)) {
      const element = users[user]
      const mention = window.file_text.split('@' + user).length - 1
      element.mention = mention
    }
  }

  /*合計通話時間*/
  for (let i = 0; i < call.length; i++) {
    const start = call[i][0]
    const end = call[i][1]
    const start_time = new Date(start)
    const end_time = new Date(end)
    console.log(start_time, end_time);
    const diff = end_time.getTime() - start_time.getTime()
    const diff_min = diff / (60 * 1000)
    statistics['call'] += diff_min
  }

  $('#status-text').text('完了')
  bar.value = 100
  $('#result, #search-box, #daily-data, #diary, #over_1000_days').show()
  $('#js-progressbar').hide()
  $('#result_title').text(
    `総メッセージ数${statistics['message']} | テキスト数${statistics['text']} | 画像数${statistics['image']} | 動画数${statistics['video']} | スタンプ数${statistics['stamp']} | 合計通話時間${statistics['call']}分`
  )
  $('#over_1000_days').text(`1日に1000メッセージを超えた日: ${Over_1000_days}`)
  const keys = Object.keys(users)
  for (let i = 0; i < keys.length; i++) {
    const user_name = keys[i]
    const user = users[keys[i]]
    $('#result_tbody').append(
      `<tr><td>${user_name}</td><td>${user['message']}</td><td>${user['contents']['text']}</td><td>${user['contents']['image']}</td><td>${user['contents']['movie']}</td><td>${user['contents']['stamp']}</td><td>${user['mention']}</td><td>${user['contents']['call']}</td><td>${Math.max.apply(Math, user['continuously'])}</td><td>${user['join']}</td></tr>`
    )
  }
  $(document).ready(function () {
    $('#result_table').DataTable({
      language: {
        url: 'http://cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Japanese.json',
      },
      displayLength: 50,
      order: [7, 'desc'],
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
$('#load').click(function (e) {
  e.preventDefault();
  loadFileAsText()
});
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
          pan: {
            enabled: true,
            mode: "x"
          },
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
  const name2 = name.replace(/[\[\]]/g, '\\$&')
  const regex = new RegExp('[?&]' + name2 + '(=([^&#]*)|&|#|$)'),
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
