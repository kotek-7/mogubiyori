#!/usr/bin/env python3
"""Rebuild the original Food Field Guide companion and cosmetic SVG collection.

No remote assets, fonts, random generation or runtime dependencies are used.
All paths are authored here; the JSON is the integration contract.
"""
from pathlib import Path
import json
import math
import sys
from html import escape
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
INK = '#202820'
PAPER = '#fff5de'
RED = '#df442d'
BLUE = '#275bbb'
GREEN = '#24624b'
YELLOW = '#f7c544'
PINK = '#f28d95'
ORANGE = '#ed822f'
PURPLE = '#7751a8'
TEAL = '#15978d'
COLLECTIONS = ['meadow','forest','seaside','market','cafe','night']


def p(d, fill=INK, stroke=INK, sw=3, **attrs):
    return tag('path', d=d, fill=fill, stroke=stroke, stroke_width=sw, **attrs)


def tag(name, **attrs):
    return '<' + name + ''.join(f' {k.replace("_", "-")}="{escape(str(v), quote=True)}"' for k,v in attrs.items()) + '/>'


def e(x,y,rx,ry,fill,stroke=INK,sw=3,**attrs):
    return tag('ellipse',cx=x,cy=y,rx=rx,ry=ry,fill=fill,stroke=stroke,stroke_width=sw,**attrs)


def c(x,y,r,fill,stroke=INK,sw=3,**attrs):
    return tag('circle',cx=x,cy=y,r=r,fill=fill,stroke=stroke,stroke_width=sw,**attrs)


def r(x,y,w,h,fill,rx=0,stroke=INK,sw=3,**attrs):
    return tag('rect',x=x,y=y,width=w,height=h,rx=rx,fill=fill,stroke=stroke,stroke_width=sw,**attrs)


def line(d,color=INK,sw=3):
    return p(d,'none',color,sw)


def group(content, transform='', **attrs):
    at = (f' transform="{transform}"' if transform else '') + ''.join(f' {k.replace("_", "-")}="{v}"' for k,v in attrs.items())
    return f'<g{at}>' + content + '</g>'


def star(x,y,rad,color=YELLOW,points=5):
    pts=[]
    for i in range(points*2):
        a=math.pi*i/points-math.pi/2
        rr=rad if i%2==0 else rad*.48
        pts.append(f'{x+math.cos(a)*rr:.1f},{y+math.sin(a)*rr:.1f}')
    return tag('polygon',points=' '.join(pts),fill=color,stroke=INK,stroke_width=2.5)


def leaf(x,y,size=20,color=GREEN,rot=0):
    return group(p(f'M0 0Q{-size} {-size*1.4} 0 {-size*2}Q{size} {-size} 0 0Z',color)+line(f'M0 0V{-size*1.6}',PAPER,2),f'translate({x} {y}) rotate({rot})')


def flower(x,y,size=12,color=PAPER):
    return ''.join(e(x+math.cos(i*math.pi/3)*size*.75,y+math.sin(i*math.pi/3)*size*.75,size*.65,size*.65,color,INK,2) for i in range(6))+c(x,y,size*.5,YELLOW,INK,2)


def svg(content, name, view='0 0 300 300', ident='asset'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" fill="none" role="img" aria-labelledby="{ident}-title" stroke-linecap="round" stroke-linejoin="round"><title id="{ident}-title">{escape(name)}</title>{content}</svg>\n'


# Each entry specifies its own species silhouette, progression and voice.
# slug, name, body, accent, silhouette, description, personality,
# favorite categories, tags, legacy growth descriptions, dialogue
PROFILES = [
('komepi','こめぴ',PAPER,RED,'rice-finch','米粒の羽とおにぎり形の胸を持つ、小さな文鳥。','一粒も残さない几帳面な収集家。','rice breakfast','お米 朝ごはん',
 ['米粒のような丸いひな。小さな海苔の前掛けが目印。','両翼が伸び、胸の海苔模様が三角に育つ。','稲穂の尾羽と三枚の風切羽を広げる。'],
 ['今日の一粒、見つけにいこう。','ぴっ！ お皿、ぴかぴか。','この香り、ずかんに一粒はさもう。','知ってるごはんは、ほっとするね。']),
('kabun','かぶん',PAPER,GREEN,'turnip-mole','かぶの根っこがしっぽになった、土いじり好きのもぐら。','道具を磨いてから出かける慎重派。','soup side','野菜 煮物',
 ['双葉と短い根を持つ、手のひらサイズのかぶ。','掘るための前足と三枚の葉が育つ。','葉が扇形に開き、くるりと長い根が伸びる。'],
 ['土のにおい、今日はいい感じ。','ほくほく、足先まであたたかい。','まだ知らない根っこの味だ！','いつもの味を、今日も掘り当てた。']),
('nanari','ななり',YELLOW,GREEN,'rapeseed-alpaca','菜の花の襟とふわりとした首を持つアルパカ。','周りの歩幅に合わせるおっとり屋。','side breakfast','野菜 春',
 ['小さな花芽を耳につけた、短い首の子。','首が伸び、二つの花が襟に咲く。','花の襟が一周つながり、長い前髪が波打つ。'],
 ['ゆっくり、ひと口ずついこう。','おなかにも、花が咲いたみたい。','初めての味、急がず覚えるね。','うんうん、また会えた味だ。']),
('ichiri','いちり',RED,GREEN,'strawberry-hare','いちごのしずく形の体に、葉っぱの長耳を持つ野うさぎ。','遠足のしおりを作るのが得意。','snack breakfast','果物 甘い',
 ['丸いいちごと一枚の葉耳。種の点は三つだけ。','二枚の葉耳が立ち、跳ねる後ろ足が伸びる。','大きな葉耳と花の尾を揺らして弾む。'],
 ['お弁当を持って、どこまで跳ぼう？','種の数だけ、うれしいな。','しおりに新しい味を描いておくね。','いつもの味は、遠足のお守り。']),
('soramame','そらまる',GREEN,YELLOW,'pea-snail','豆さやの貝殻を背負った、散歩好きのかたつむり。','遅くても寄り道は欠かさない。','side soup','豆 野菜',
 ['一粒だけの丸い殻と短い触角。','殻が二粒のさやに伸び、触角がくるんと曲がる。','三粒の豆が並ぶ殻と、葉の旗を背負う。'],
 ['今日の寄り道、ごはんのにおい。','ゆっくり食べると、長くうれしい。','知らない味まで、たどり着いたよ。','この道、この味、覚えているよ。']),
('himari','ひまり',YELLOW,RED,'sunflower-hedgehog','ひまわりの花びらを針の代わりに広げるハリネズミ。','朝一番にカーテンを開ける元気者。','rice main','香ばしい 卵',
 ['種の模様の背中に、花びらが三枚。','花びらが半円に開き、鼻先が少し伸びる。','大輪の花を背負い、葉の足でどっしり立つ。'],
 ['おひさまより先に、おはよう！','背中いっぱい、元気が咲いた！','新しい味で、花びらが一枚増えそう。','この味で、今日もぱっと開こう。']),
('kurune','くるね',ORANGE,GREEN,'chestnut-squirrel','栗の実形の頭と、いがいがの大きな尾を持つリス。','拾ったものを小箱に整理する。','rice snack','秋 香ばしい',
 ['栗の帽子に短い丸尾を持つ子。','耳が立ち、尾に栗のいが模様が現れる。','扇のような大尾と白い栗座が育つ。'],
 ['おいしい発見、箱にしまっておこう。','ほっぺの宝箱がいっぱい。','これは新しい引き出しが必要だね。','お気に入りの棚に、またひとつ。']),
('shiipo','しいぽ',RED,PAPER,'mushroom-tapir','きのこの傘を背負い、くるんと短い鼻を持つバク。','雨音を数える静かな聞き役。','soup main','きのこ 煮込み',
 ['丸い傘からちょこんと顔を出す。','傘のつばが広がり、鼻が曲がる。','二段の傘と襞模様が育ち、足取りが頼もしくなる。'],
 ['ぽつぽつ、鍋の音が聞こえるね。','湯気の向こうまで、おいしい。','その味の話、もう少し聞かせて。','雨の日にも、晴れの日にも、これ。']),
('waramo','わらも',GREEN,YELLOW,'fern-chameleon','わらびの巻き尾と、シダの背びれを持つカメレオン。','小さな違いを見つける観察家。','side noodles','緑 野菜',
 ['ひと巻きの尾と、小さな丸い頭。','尾が二重に巻き、背びれが三枚になる。','シダの背びれを広げ、両目で遠くを見渡す。'],
 ['昨日と違う葉っぱ、見つけた？','ひと口ごとに、発見があるね。','新しい味の形、よく観察しよう。','同じ料理にも、今日だけのところ。']),
('donguri','どんり',ORANGE,BLUE,'acorn-boar','どんぐりの兜をかぶった、前向きなうり坊。','失敗したらもう一度並べ直す。','main rice','根菜 和食',
 ['丸いどんぐり帽と短い鼻の子。','帽子の軸が伸び、背に縞が三本現れる。','大きな襟と小さな牙を持つ森の案内役。'],
 ['まず一歩。においのするほうへ！','おなかが満ちたら、もう一歩！','初めてでも、まずひと口だね。','帰り道の味、ちゃんと覚えたよ。']),
('kuruwu','くるう',ORANGE,PAPER,'walnut-owl','くるみの殻の眉と、左右で模様の違う翼を持つフクロウ。','考えごとをすると首をかしげる。','snack soup','ナッツ 温かい',
 ['丸い殻の中に、二つの大きな目。','割れ目の眉と小さな翼が育つ。','殻模様の大翼と羽角を広げる。'],
 ['ふむ、今日の献立には何が隠れている？','なるほど、これはうれしい答え。','問いがひとつ、味がひとつ増えた。','何度考えても、好きな味だ。']),
('takenon','たけのん',GREEN,PAPER,'bamboo-panda','たけのこの段々帽と、笹の尾を持つ小さなパンダ。','片付けの順番を考えるのが好き。','side rice','たけのこ 春',
 ['一段のたけのこ頭と、丸い耳。','帽子が二段になり、笹の尾が伸びる。','三段の帽子と葉の肩掛けを持つ。'],
 ['ごはんの前に、机をひと拭き。','よく噛むと、いい音がするね。','新しい味、順番に覚えていこう。','おなじみの味が、暮らしの節目。']),
('wakarun','わかるん',GREEN,TEAL,'wakame-otter','わかめのひらひら襟を持ち、貝を集めるラッコ。','気に入ったものを何度も磨く。','soup noodles','海藻 だし',
 ['小さなひれ足と一枚のわかめ襟。','長い尾と二枚の襟が育つ。','波打つ大きな襟と、磨いた貝の腹飾りを持つ。'],
 ['きらっとする味、探してたんだ。','おなかの貝まで、つやつや気分。','この味も、大切に磨いていこう。','いつもの味は、手になじむ貝みたい。']),
('hotape','ほたぺ',PAPER,RED,'scallop-seal','ほたて貝の扇形の背中を持つ、拍手好きのアザラシ。','人の小さな成功にすぐ拍手する。','main soup','魚介 蒸し料理',
 ['丸い貝から顔と小さなひれが出る。','貝の筋が増え、左右のひれが伸びる。','扇形の貝を大きく開き、尾びれが二つに分かれる。'],
 ['今日も作れたね。ぱち、ぱち！','おいしい一皿に、ぱちぱちぱち！','新しい挑戦にも、大きな拍手！','いつもの一皿にも、ちゃんと拍手。']),
('shiochi','しおち',BLUE,PAPER,'salt-penguin','塩の結晶の冠と、四角い翼を持つペンギン。','きっちり並んだ足跡を見るのが好き。','rice main','塩焼き 魚',
 ['一粒の結晶と短い羽のひな。','羽が角ばり、結晶が三つになる。','大きな結晶冠と階段形の尾羽が育つ。'],
 ['ひとつまみの準備はできてるよ。','ちょうどいいって、いい言葉だね。','知らない味にも、まっすぐ一歩。','この味の足跡、またたどろう。']),
('konburuu','こんぶる',GREEN,YELLOW,'kelp-seadragon','昆布の長いひれと、渦巻く尾を持つ海竜。','話すより先に鼻歌が出る。','soup main','だし 煮込み',
 ['一枚のひれと短い渦巻き尾。','二枚のひれと小さな角が育つ。','三枚の長い昆布ひれを波のように広げる。'],
 ['ふんふん、だしの歌が聞こえる。','おなかの中で、いい和音。','新しい節を、ひとつ覚えたよ。','この旋律は、何度でも好き。']),
('aosaya','あおさや',TEAL,GREEN,'seaweed-ray','あおさの縁取りを持つ、凧のようなエイ。','風や潮の流れを読むのが得意。','noodles side','海藻 麺',
 ['三角の小さな翼と、まっすぐな尾。','ひらひらした翼端と長い尾が育つ。','菱形の大翼を広げ、尾に小さな葉がつく。'],
 ['いいにおい、こっちの流れに乗ってる。','ふわっと、気持ちも浮かぶね。','新しい潮に、乗ってみよう。','戻ってこられる味があるっていいね。']),
('kohakani','こはかに',ORANGE,BLUE,'amber-hermit','琥珀色の巻き貝と、左右で大きさの違うはさみを持つヤドカリ。','引っ越し先の間取りを描くのが趣味。','main rice','魚介 丼',
 ['一巻きの小さな殻から顔を出す。','歩脚が増え、右のはさみが大きくなる。','二重巻きの殻と看板のような大ばさみを持つ。'],
 ['今日の食卓、居心地よさそうだね。','ここを第二のおうちにしようかな。','新しい味の部屋が、ひとつ増えた。','やっぱりこの席、この味だね。']),
('papriko','ぱぷりこ',RED,GREEN,'pepper-cat','パプリカの三つ山の体と、へたの耳を持つネコ。','拍子に合わせてしっぽを振る。','main side','彩り 炒め物',
 ['丸い実と片方だけ立った葉耳。','体が三つ山になり、曲がったへた尾が伸びる。','大きな葉耳と鮮やかな胸模様で踊る。'],
 ['たん、たん。まな板のリズムだね。','おいしい拍子で、しっぽが止まらない。','新しいリズムの料理だ！','いつもの曲、いっしょに鳴らそう。']),
('renpuku','れんぷく',PAPER,PINK,'lotus-axolotl','れんこんの穴模様と、花びらのえらを持つウーパールーパー。','向こう側をのぞく好奇心旺盛な子。','side soup','根菜 シャキシャキ',
 ['小さな横長の顔と、二枚のえら。','えらが四枚になり、腹の穴模様が増える。','六枚の花えらと、薄い蓮の葉の尾が育つ。'],
 ['そのお鍋の向こう、のぞいてもいい？','穴の向こうまで、おいしいね。','新しい景色が見えた気がする！','知ってる景色にも、発見があるね。']),
('negin','ねぎん',PAPER,GREEN,'leek-ferret','長いねぎの葉の耳を持つ、すばしっこいフェレット。','困っている人の横にすっと現れる。','noodles soup','ねぎ 麺',
 ['白い丸顔に短い緑の耳が二つ。','体と耳が伸び、しましまの尾が現れる。','三枚の葉耳と長い尾をなびかせる。'],
 ['手が足りないところ、ある？','ひと口いただいたら、またお手伝い。','初めての仕事みたいで、わくわくする。','おなじみの段取り、おなじみの味。']),
('caroron','きゃろろん',ORANGE,GREEN,'carrot-fox','にんじんの細い鼻と、房葉の尾を持つキツネ。','目印を見つけるのが上手な探検家。','side main','にんじん ロースト',
 ['三角の小さな顔と、短い葉尾。','耳が高く立ち、尾の葉が三枚になる。','長い鼻先と房になった尾で道案内する。'],
 ['いいにおいが、今日の道しるべ。','目的地は、ここだったみたい。','新しい道をひとつ覚えたよ。','この道なら、目をつぶっても来られる。']),
('nasumii','なすみー',PURPLE,GREEN,'eggplant-bat','なすのしずく形の体と、へたの翼を持つコウモリ。','夕方の買い物が大好き。','main side','なす 焼き物',
 ['丸い紫の実と、短い三角耳。','緑の翼が二つに開き、体が長くなる。','大きな葉の翼を広げ、へたの襟を揺らす。'],
 ['夕方の市場、いっしょにひと回り。','今日の買い物、大成功だね。','知らないお店を見つけた気分。','なじみのお店の味は、うれしいな。']),
('poncoro','ぽんころ',ORANGE,GREEN,'pumpkin-raccoon','かぼちゃの縦筋と、まんまるな葉しっぽのタヌキ。','お店の呼び込みをすぐ覚える。','soup snack','かぼちゃ ほくほく',
 ['二本の筋と、小さな丸耳を持つ。','体に筋が増え、目の周りの模様が広がる。','大きな丸い体と巻きつるの尾が育つ。'],
 ['寄ってらっしゃい、今日のごはん！','ぽん、とおなかをたたきたい気分。','新メニュー、声に出して覚えよう。','おなじみの味、本日もあります！']),
('pururin','ぷるりん',YELLOW,ORANGE,'pudding-fawn','プリンの斜面の体と、カラメルの小さな角を持つ子鹿。','揺れるものを見るとつい見入る。','snack breakfast','卵 甘い',
 ['一粒のカラメル飾りと、小さな耳。','二つの角と細い前足が育つ。','枝分かれしたカラメル角と白い斑点を持つ。'],
 ['お皿を置く音、やさしくて好き。','うれしくて、少しぷるっとしちゃう。','初めての味に、胸がぷるぷる。','この味なら、落ち着いて味わえる。']),
('moffuru','もっふる',YELLOW,RED,'waffle-shiba','ワッフルの格子模様と、四角く巻いた尾を持つ柴犬。','約束の時間より少し早く待つ。','breakfast snack','パン 香ばしい',
 ['丸い格子の体と、小さな垂れ耳。','耳が立ち、格子模様が四角くなる。','ふっくらした四角い体と、巻き尾が育つ。'],
 ['待ってたよ。席も温めておいた！','よく焼けたにおい、大好き。','初めての味も、ちゃんと待ってた！','おかえり、この味が待ってたよ。']),
('panri','ぱんり',ORANGE,PAPER,'croissant-armadillo','クロワッサンの節を持つ、丸まるのが得意なアルマジロ。','旅先から絵はがきを送るのが好き。','breakfast soup','パン 洋食',
 ['小さな半月の殻と丸い鼻。','殻が三層に重なり、尾が伸びる。','大きな焼き色の殻と、五本の節が育つ。'],
 ['今日の食卓から、絵はがきを一枚。','この香り、封筒に入れて送りたい。','新しい町を訪ねた気分だよ。','また来たくなる味って、あるよね。']),
('monaro','もなろ',PAPER,RED,'wafer-hamster','もなかの花型の頬と、あんこの小さな足を持つハムスター。','集まりではお茶を配る係。','snack breakfast','和菓子 豆',
 ['丸いもなかと、小さなあんこの耳。','頬が花型にふくらみ、前足が伸びる。','六つの花びら型の体と、格子の縁取りが育つ。'],
 ['お茶も一緒に、どうぞどうぞ。','ほっぺいっぱい、おもてなしの味。','次のお茶会で、教えてあげよう。','いつものお茶請け、落ち着くね。']),
('mintotto','みんとっと',GREEN,PAPER,'mint-moth','ミントの葉脈が入った翼を持つ、小さな蛾。','窓を開けて風向きを確かめる。','snack side','ハーブ 爽やか',
 ['二枚の小さな葉を閉じた子。','上の翼が開き、触角が曲がる。','四枚の葉翼と長い触角を広げる。'],
 ['窓を開けたら、いい風が来たよ。','おなかにも、すうっといい風。','初めての香り、風に乗せて覚えよう。','この香りがすると、帰ってきた気分。']),
('cacaoro','かかおろ',ORANGE,BLUE,'cacao-anteater','カカオの実の縦筋と、長い鼻を持つアリクイ。','香りを言葉にするのが得意。','snack main','カカオ 香ばしい',
 ['丸い実と短い鼻先。','鼻が長くなり、縦筋と太い尾が育つ。','大きなカカオ尾と長い前足を持つ。'],
 ['香りの手紙、届いているよ。','香ばしい、やわらかい、うれしい！','この香りには、どんな名前をつけよう。','好きな香りは、何度でも読みたいね。']),
('tsukimo','つきも',PURPLE,YELLOW,'sweet-potato-dormouse','焼きいもの皮色の体と、黄色い月の腹を持つヤマネ。','夜の予定を小さな手帳に書く。','snack soup','さつまいも 温かい',
 ['丸い皮の体に、小さな黄色い点。','耳が開き、月形のおなかと長い尾が育つ。','大きな月模様と、ふさふさの皮色の尾を持つ。'],
 ['今夜の予定に、ごはんを書き足そう。','ほくほくした時間、手帳に残すね。','新しいページを、ひらく味だ。','この予定は、何度入れてもうれしい。']),
('mitsuru','みつる',INK,YELLOW,'syrup-lanternfish','黒みつの丸い体と、琥珀色の灯りを持つチョウチンアンコウ。','暗い道を一歩ずつ照らす。','snack breakfast','甘い 和菓子',
 ['短い灯りと、丸い小さなひれ。','灯りの柄が曲がり、尾びれが育つ。','大きな琥珀の灯りと、透かし模様のひれを持つ。'],
 ['このへん、少し明るくしておくね。','おなかの灯りまで、ぽっとした。','知らない味にも、灯りを向けてみよう。','いつもの明かり、いつもの味だ。']),
('ankoro','あんころ',RED,PAPER,'azuki-flying-squirrel','小豆の丸い頭と、もち色の飛膜を持つモモンガ。','届いた便りを声に出して読む。','snack rice','豆 もち',
 ['小豆の頭と、たたんだ白い手。','手と足の間に飛膜が広がる。','四角い大きな飛膜と、小豆模様の長い尾を持つ。'],
 ['おいしい便り、受け取りに来たよ。','この気持ち、すぐ手紙にしたい。','新しい味の便りが届いた！','いつもの便りは、何度読んでもうれしい。']),
('ramunon','らむのん',BLUE,TEAL,'soda-jellyfish','ラムネ瓶の泡模様と、リボンの触手を持つクラゲ。','夜空の形を勝手に名付ける。','snack side','冷たい 夏',
 ['一粒の泡と、二本の短いリボン。','傘が広がり、リボンが四本になる。','瓶の口のような冠と、六本の長いリボンを持つ。'],
 ['あの星、冷やしトマトに見えない？','しゅわっと、気分が上がったよ。','この味にも、星の名前をつけたいな。','いつもの星座みたいに、見つけるとうれしい。']),
('yorucha','よるちゃ',GREEN,PAPER,'tea-leaf-fox','茶葉の耳と、急須の注ぎ口のような巻き尾を持つキツネ。','話の続きをゆっくり待てる聞き手。','snack soup','お茶 温かい',
 ['短い葉耳と、一巻きの細い尾。','葉耳に葉脈が入り、尾が二股になる。','三つ又の茶葉尾と、大きな胸の葉飾りを持つ。'],
 ['お茶が冷めるまで、お話ししよう。','このひと口で、ひと息つけたね。','知らない味の話、ゆっくり聞かせて。','何度目でも、その話と味が好き。']),
('suirenne','すいれんね',PINK,TEAL,'lotus-water-dragon','睡蓮の襟と、蓮の葉のひれを持つ水辺の小竜。','一日の最後に良かったことを数える。','soup side','野菜 だし',
 ['小さな花芽の襟と、短い丸尾。','襟が三枚に開き、水かきの手が育つ。','大きな睡蓮の襟と、蓮の葉の尾びれを広げる。'],
 ['今日のよかったこと、一皿増えそう。','よかったこと、今のでひとつ。','初めての味に出会えた日、覚えておこう。','変わらず好きな味があるのも、いいこと。']),
]

# Headwear sits on the actual head, including the off-center snail and
# armadillo. Coordinates describe the brim center in unscaled adult space.
HEAD_ANCHORS = [
 (150,82,.90),(150,98,.90),(151,83,.77),(150,105,.83),(62,180,.46),(151,139,.73),
 (150,91,.95),(150,68,.83),(150,91,.80),(150,61,.72),(150,93,.90),(150,42,.49),
 (150,93,.86),(150,131,.78),(150,88,.78),(148,95,.75),(150,91,.74),(150,180,.82),
 (150,94,.88),(150,102,.90),(150,91,.80),(150,105,.85),(150,106,.73),(150,100,.88),
 (150,104,.73),(150,97,.94),(89,142,.55),(150,100,.91),(150,99,.57),(156,108,.64),
 (150,100,.90),(145,111,.92),(150,88,.88),(150,60,.60),(150,105,.83),(150,93,.70),
]


def face(x=150,y=148,kind='normal',light=False):
    col=PAPER if light else INK
    if kind=='owl':
        return c(x-28,y,24,PAPER)+c(x+28,y,24,PAPER)+c(x-25,y,8,INK,'none')+c(x+25,y,8,INK,'none')+p(f'M{x-7} {y+14}h14l-7 11Z',YELLOW)
    eyes=c(x-24,y,5,col,'none')+c(x+24,y,5,col,'none')
    return eyes+line(f'M{x-8} {y+17}q8 10 16 0',col,3.5)+c(x-24,y-2,1,PAPER,'none')+c(x+24,y-2,1,PAPER,'none')


def adult_art(slug,s,b,a):
    """Species paths are deliberately different; stages add functional anatomy."""
    back=''; main=''; front=''; f=face()
    foot=lambda x,y=248: e(x,y,19,11,a)
    # The common face and paper/ink vocabulary unify these very different outlines.
    if slug=='komepi':
        back=p('M112 228l-25 30 34-7 14-25M173 229l27 28-5-36Z',RED)
        main=p('M77 186C55 117 113 69 148 76c37-1 92 43 78 114-9 52-130 61-149-4Z',b)+p('M126 180l24-30 26 31v35h-50Z',INK)
        front=p('M143 166l7-10 8 10Z',YELLOW)
        if s: main+=p('M80 168q-22 18 1 49l22-24Z',b)+p('M218 167q23 19-2 50l-19-24Z',b)
        if s==2: back+=line('M209 243l29-74',GREEN,5)+''.join(leaf(219+i*4,220-i*12,8,YELLOW,65) for i in range(4)); front+=line('M82 189l15 8m-18 2 14 8m121-18-15 8m19 2-14 8',RED,3)
    elif slug=='kabun':
        back=p('M147 222c-24 40 22 27 11 49-2-14 19-17 11-37Z',b)
        for i in range(s+2): back+=leaf(150,94,23+s*4,GREEN,(i-(s+1)/2)*36)
        main=p('M78 125q16-46 73-35 65-8 76 44 13 68-77 108-83-36-72-117Z',b)+line('M100 172l13-3m78 2 15 4M111 199l14-2',INK,3)
        if s: front+=p('M80 183q-29 4-13 24l28-9m120-15q31 4 14 24l-27-9',b)+line('m70 195 5 8m7-12 5 8m136-5-5 8',INK,2)
    elif slug=='nanari':
        back=foot(114)+foot(184)+p('M99 102Q65 55 86 59l39 40m48 0q44-51 45-34l-18 42Z',b)
        main=p('M92 150Q83 97 121 86q28-20 59 0 31 8 25 66l-23 15v28q57 7 38 49H82q-10-43 36-49v-29Z',b)
        front=e(151,147,43,26,PAPER)+face(150,130)
        f=''
        for i in range(1+s*2): front+=flower(104+i*17,192+abs(2-i)*2,10,RED if i%2 else PAPER)
        if s==2: front+=p('M104 108q2-34 24-20 10-22 28-11 25-9 37 19-19-14-35 6-26-15-54 6Z',PAPER)
    elif slug=='ichiri':
        back=foot(105)+foot(195)+leaf(127,101,24+s*7,GREEN,-22)
        if s: back+=leaf(173,100,28+s*5,GREEN,25)
        main=p('M72 136q9-50 77-35 70-15 80 35 5 45-80 108-81-56-77-108Z',b)
        front=''.join(p(f'M{x} {y}l3-5 3 5-3 5Z',YELLOW,'none') for x,y in [(96,119),(140,112),(188,123),(103,187),(137,210),(182,191),(203,164)][:3+s*2])
        if s==2: back+=flower(227,214,18,PAPER)
    elif slug=='soramame':
        back=p('M77 197q-22-35-42-15-17 19 22 47 103 57 204 12-43 4-65-28Z',a)
        main=p('M68 175q-5-67 74-77 78-12 83 54 12 57-65 66-79 13-92-43Z',b)
        main+=''.join(c(104+i*41,163,25,YELLOW) for i in range(1+s))
        front=line('M71 184q-11-42-28-30m43 26q3-52 20-43',INK,5)+c(43,154,6,b)+c(106,137,6,b)
        f=face(62,200)
        if s==2: front+=line('M208 151V85',INK,4)+leaf(208,108,15,GREEN,70)
    elif slug=='himari':
        for i in range(3+s*4):
            angle=-118+i*(236/(2+s*4));back+=group(p('M-13-48q-21-37 10-64 27 31 15 69Z',YELLOW),f'translate(153 150) rotate({angle})')
        main=e(150,160,77,75,ORANGE)+p('M74 164q6-55 65-34 22 1 45 25 54 7 43 35-25 52-94 48-62-11-59-74Z',PAPER)
        front=c(220,172,7,INK)+foot(110)+foot(180)+''.join(line(f'M{x} {y}l5 8',INK,3) for x,y in [(101,110),(125,100),(154,98),(179,107)])
        f=face(159,174)
    elif slug=='kurune':
        back=p('M185 235Q272 242 271 147q-5-36-46-38 19 23-8 39-63 21-32 87Z',a)
        if s==2: back+=p('M221 237l21-12-2-13 16-7-4-14 16-12-11-12 9-18-16-3-2-19-12 5-10-22-7 28-25 15Z',ORANGE)
        main=p('M79 145Q72 101 124 85l23-18 23 19q52 12 50 63l-28 43 15 54q-49 29-101-1l13-50Z',b)+p('M82 144q52-38 135 0l-25 47q-38 20-78 0Z',PAPER)
        front=foot(110)+foot(182)+c(122,210,13,PAPER)+c(180,210,13,PAPER)
        if s: back+=p('M90 109 95 58l38 29m35 0 34-29 5 50Z',b)
    elif slug=='shiipo':
        back=foot(100)+foot(198)
        main=p('M92 118q-17 44-4 109 54 37 116 1 22-79-6-112Z',PAPER)+p('M55 124q13-61 93-62 80 1 99 62-97 36-192 0Z',b)
        front=p('M168 155q52-7 51 27-4 19-31 10 20-3 6-16l-24 2Z',PAPER)
        f=face(137,157)
        for x,y in [(102,98),(162,83),(207,109)]:front+=e(x,y,12,7,PAPER,INK,2)
        if s: front+=line('M76 127l12 12m26-5 7 13m34-12v13m31-17-7 13m39-17-12 12',INK,3)
        if s==2: back+=p('M65 143Q147 103 235 143l-2 17H67Z',YELLOW)
    elif slug=='waramo':
        back=p('M195 217q72 39 65-11-4-32-24-12 22-5 9 10-15 11-32-10Z',b)
        main=p('M76 156q-13-66 48-69 51-26 89 17l13 49-21 35q28 33-8 58l-90-3q-44-17-31-87Z',b)
        front=foot(103)+foot(198)+e(112,139,21,25,PAPER)+e(190,139,21,25,PAPER)+c(116,141,7,INK)+c(187,141,7,INK)+line('M140 172q12 10 25-3')
        f=''
        for i in range(1+s*2): back+=p(f'M{160+i*15} {103+i*22}l18-39 19 28Z',YELLOW)
        if s==2: front+=line('M95 195l15 12m67-11 12 11',YELLOW,6)
    elif slug=='donguri':
        back=foot(98)+foot(203)+p('M75 127 67 85l45 17m70 0 48-18-16 44Z',ORANGE)
        main=p('M72 154q-4-60 80-62 77 6 76 65l-8 70q-58 44-139 3Z',b)+p('M77 104q3-54 70-52 73 2 77 57-70 20-147-5Z',GREEN)+line('M150 55q-15-30 12-29',INK,7)
        front=e(150,174,35,23,PINK)+e(138,173,4,8,INK,'none')+e(162,173,4,8,INK,'none')
        f=face(150,139)
        if s: front+=line('M110 111v16m26-18v16m28-16v16m26-12v16',YELLOW,6)
        if s==2: front+=p('M111 181q-20-14-11-24l13 12m77 12q20-14 11-24l-13 12Z',PAPER)
    elif slug=='kuruwu':
        back=foot(109)+foot(191)
        if s:back+=p('M96 118q-50 13-46 87l44 31 26-43m84-74q52 13 45 85l-44 32-26-45Z',b)
        main=p('M82 139Q59 69 140 74l10 17 10-17q80-6 59 65l-4 87q-63 47-133 0Z',b)+p('M151 91v151', 'none',INK,5)
        f=face(150,143,'owl'); front=line('M97 196q14-22 26 0m-13 16q14-22 26 0m34-17q14-22 26 0m-14 19q14-22 26 0',PAPER,3)
        if s==2:back+=p('M84 107 78 48l58 45m30 0 60-44-7 61Z',b);front+=line('M62 162l25 28m-28-12 24 30m155-46-25 28m28-12-24 30',INK,3)
    elif slug=='takenon':
        back=foot(106)+foot(191)+c(87,118,21,INK)+c(214,118,21,INK)
        if s: back+=leaf(211,234,29,GREEN,55)
        main=e(150,184,70,65,b)+e(150,137,80,60,PAPER)+e(114,137,20,26,INK)+e(190,137,20,26,INK)
        f=face(151,142,light=True)
        for i in range(1+s):front+=p(f'M{91+i*10} {104-i*20}l{59-i*10} -35 {59-i*10} 35q-55 12-{118-i*20} 0Z',GREEN)
        front+=e(150,214,38,30,PAPER)
        if s==2:front+=leaf(104,202,25,YELLOW,-45)+leaf(197,202,25,YELLOW,45)
    elif slug=='wakarun':
        back=p('M198 217q82-5 54 36-33 23-62-19Z',b)+foot(109)+foot(185)
        main=e(150,188,65,65,b)+c(86,111,19,b)+c(213,111,19,b)+e(150,140,82,58,b)+e(150,157,51,28,PAPER)
        front=p('M99 189q-19 21 11 33l26-19m66-14q19 21-11 33l-26-19Z',b)
        f=face(150,137)
        for i in range(s+1): front+=p(f'M{86+i*42} 183q-19 10 1 22-19 10 2 23l25-17-6-23Z',TEAL)
        if s==2:front+=p('M132 221q-10-39 18-36 26-2 19 36Z',PAPER)+line('M150 191v25m-12-21 7 20m18-19-7 19',INK,2)
    elif slug=='hotape':
        back=p('M89 213 49 235l28 13 30-19m96-16 48 20-30 20-24-24Z',a)
        main=p('M82 201Q43 90 145 69q113 23 73 133Z',PAPER)
        front=''.join(line(f'M150 207L{x} {y}',RED,4) for x,y in [(79,110),(104,83),(148,73),(191,88),(225,119)][:1+s*2])
        front+=e(150,183,64,57,b)+e(150,197,42,28,PAPER)
        f=face(150,177)
        if s==2:back+=p('M124 233 105 263l47-15 43 15-20-33Z',a)
    elif slug=='shiochi':
        back=foot(111)+foot(190)
        main=p('M90 197V126q0-45 60-48 61 3 61 48v76l-20 49h-84Z',b)+p('M105 159q8-30 45-18 36-12 45 18l3 70q-47 25-97 0Z',PAPER)
        front=p('M83 167 63 200l27 15 10-39m115-9 23 33-25 16-11-39Z',b)+p('M143 161h16l-9 11Z',YELLOW)
        for i in range(1+s):front+=p(f'M{125+i*17} {91-i%2*8}v-25l11-8 11 8v25Z',TEAL)
        if s==2:back+=p('M196 223h46v12h-10v11h-17v12h-20Z',b)
    elif slug=='konburuu':
        back=p('M181 227q99 21 69-48-7-10-17 0 40 61-41 29Z',b)
        main=p('M96 218Q87 189 103 168 62 143 87 113l19-32 27 11 18-20 21 22q50 7 40 55-9 29-33 30 42 21 28 61-63 26-111-22Z',b)
        front=p('M131 174q-30 24-8 56h56q14-33-8-59Z',YELLOW)+foot(107)+foot(186)
        for i in range(1+s):back+=p(f'M{191+i*15} 202q48-69 8-104-9 25-27 37 22 21-1 55Z',GREEN if i%2 else TEAL)
        f=face(148,140)
        if s==2:front+=line('M133 191h29m-34 15h42m-39 15h35',GREEN,3)
    elif slug=='aosaya':
        main=p('M150 89Q122 129 54 168l-23 45q82-6 119 34 41-42 121-34l-24-48q-66-36-97-76Z',b)
        back=line('M156 219q-18 62 66 52',INK,8)+line('M156 219q-18 62 66 52',GREEN,4)
        front=p('M73 184q20 38 78 50 67-22 78-48-41 15-78-23-42 36-78 21Z',PAPER)
        f=face(151,184)
        if s: front+=p('M52 170l-10 20 23-5 9 18 17-12m139-22 23 21-26-4-8 19-18-13Z',GREEN)
        if s==2:back+=leaf(224,271,17,GREEN,95);front+=c(111,128,5,YELLOW)+c(185,128,5,YELLOW)
    elif slug=='kohakani':
        back=''.join(line(f'M{x} 221l{dx} 15 {dx} 11',RED,8) for x,dx in [(90,-21),(103,-13),(196,13),(210,21)])
        main=p('M86 186q-13-62 29-96 41-26 81 6 50 38 17 101Z',b)+line('M171 182q-69 7-50-49 15-37 55-13 30 23-4 38-24 6-21-13',INK,5)+e(150,211,69,37,RED)
        front=line('M96 207 68 184m136 26 29-39',INK,10)+p('M67 186q-31-2-18-37l15 15 17-17q10 33-14 39Z',RED)
        if s:front+=p('M233 176q-43-8-21-57l25 26 27-23q14 48-31 54Z',RED)
        f=face(150,207)
        if s==2:front+=star(246,166,9,YELLOW)
    elif slug=='papriko':
        back=foot(106)+foot(192)+p('M196 217q71 45 62-19-11-22-18-6 15 31-39 10Z',GREEN)
        back+=p('M81 126 76 58l44 39m59 0 47-40-8 69Z',GREEN)
        main=p('M77 126q-9-53 35-43 34-31 66 0 51-11 49 43l-11 87q-21 50-54 24-37 29-72-13Z',b)
        front=line('M108 100q-23 91 13 133m69-131q22 91-17 132',INK,3)
        if s:front+=p('M121 172q30 33 58-1l-8 33h-44Z',PAPER)
        if s==2:front+=p('M148 89q-3-36 27-32l-6 15q-16-7-8 19Z',GREEN)
    elif slug=='renpuku':
        for side in [-1,1]:
            for j in range(1+s):back+=e(150+side*(75+j*8),110+j*22,26,10,PINK,INK,3,transform=f'rotate({side*(j-1)*27} {150+side*(75+j*8)} {110+j*22})')
        main=e(150,196,59,55,b)+e(150,140,79,49,b)+foot(106)+foot(195)
        front=''.join(e(x,y,6,9,INK,'none') for x,y in [(132,201),(157,193),(178,210),(151,220)][:2+s])
        if s==2:back+=p('M194 220q47-29 67 15-38 32-65 3Z',TEAL)+line('M207 233l41 2',PAPER,3)
    elif slug=='negin':
        back=p('M177 219q84 18 83-40 23 64-41 81l-42-18Z',b)+foot(108)+foot(190)
        for i in range(2+(s==2)):back+=p(f'M{99+i*36} 111l-10-75 16-12 13 85Z',GREEN)
        main=p('M94 125q-9-41 53-44 67-1 58 47l-18 49q37 15 27 62-50 32-113 5-13-41 20-61Z',b)
        front=e(150,208,26,31,YELLOW)
        if s:front+=line('M233 210l18 12m-35 4 13 17',GREEN,12)
        if s==2:front+=p('M98 185q-32 7-10 27l24-10m85-19q26 10 14 23l-27-9Z',b)
    elif slug=='caroron':
        back=p('M83 119 79 42l57 57m25 0 62-55-4 81Z',ORANGE)+foot(105)+foot(192)
        for i in range(s+1):back+=leaf(207,230,32,GREEN,50+i*20)
        main=p('M79 144q-3-55 72-46 75-9 69 46l-39 42 23 54q-46 21-108 0l23-56Z',ORANGE)+p('M80 143l69 34 68-34-37 57-30 12-31-12Z',PAPER)
        front=c(149,177,7,INK)+line('M128 220l42-1',INK,3)
        f=face(150,132)
        if s==2:front+=line('M101 106l9 15m82-15-9 15',YELLOW,5)
    elif slug=='nasumii':
        for side in [-1,1]:
            if s:back+=group(p('M0 0 50-50q10 28 18 58-19-13-24 9-13-19-28 3Z',GREEN),f'translate({150+side*54} 139) scale({side} 1)')
        main=p('M116 107q-20-38 2-44l31 34 32-34q22 13 3 44 58 53 24 104-24 45-61 34-44 4-60-40-19-51 29-98Z',b)
        front=p('M105 112 112 82l31 12 11-26 17 28 27-6-11 28-34-7Z',GREEN)+e(155,199,27,31,PAPER)
        f=face(150,151,light=True)
        if s==2:front+=line('M218 115l18 41m-155-39-15 41',PAPER,3)
    elif slug=='poncoro':
        back=c(86,99,20,GREEN)+c(215,99,20,GREEN)+foot(103)+foot(198)
        if s:back+=line('M211 222q70 39 41-14-22-22-27-4',GREEN,15)
        main=p('M73 128q1-56 55-36 28-12 49 0 51-20 52 36l1 63q-8 71-62 53-23 16-42 0-60 15-61-51Z',ORANGE)
        front=p('M88 131q27-26 61 13 38-39 67-13l-6 34q-42 10-61-5-24 18-57 3Z',INK)
        f=face(150,146,light=True)
        if s:front+=line('M113 189q-12 31 14 56m58-56q13 31-14 56',INK,3)
        if s==2:front+=p('M141 94q-10-46 20-46l9 13q-20 0-14 33Z',GREEN)
    elif slug=='pururin':
        back=p('M83 114q-30-16-24-37 34 3 47 22m87 15q34-21 45-8-9 31-31 32Z',b)+foot(108)+foot(194)
        if s:back+=line('M115 90l-14-42m79 40 13-40',ORANGE,8)
        if s==2:back+=line('M106 64 88 60m99 7 19-11m-94 19 10-17m62 20-9-21',ORANGE,7)
        main=p('M101 98q46-20 100 0l24 137q-72 29-151 0Z',YELLOW)+p('M101 98q51-23 101 0l5 32q-22 21-33 1-18 26-30 0-24 23-49-1Z',ORANGE)
        front=''.join(c(x,y,5,PAPER,'none') for x,y in [(109,192),(190,190),(123,222),(178,220)][:2+s])
        f=face(150,166)
    elif slug=='moffuru':
        back=foot(104)+foot(195)+p('M94 111 77 54l52 39m41 0 50-40-12 59Z',ORANGE)
        if s:back+=p('M204 207h54v43h-36v-18h18v-10h-36Z',ORANGE)
        main=r(74,92,151,151,YELLOW,29)+r(87,104,124,121,ORANGE,20)
        front=line('M114 107v115m37-116v117m35-116v114M88 134h120M88 170h120M90 202h115',YELLOW,7)+p('M107 180q42-28 85 0v36h-85Z',PAPER)
        if s==2:front+=p('M128 218h45l-6 16h-32Z',RED)
        f=face(150,148)
    elif slug=='panri':
        back=foot(98)+foot(192)+p('M196 224q39 35 61 17l-28-36Z',b)
        main=p('M70 184q-3-86 71-102 74-7 92 77l-32 58-90 18Z',b)+p('M75 149q-28 10-25 42l55 23 20-27Z',PAPER)
        front=line('M132 91q-28 67 4 141m21-145q-15 74 5 145m14-133q20 49 7 127',PAPER,5)
        f=face(94,169)
        if s:front+=line('M94 112q-18 40 1 88m108-81q23 43 2 78',INK,3)
        if s==2:front+=p('M105 225l-11 20h21m66-26 12 26h19Z',PAPER)
    elif slug=='monaro':
        back=c(96,95,20,RED)+c(205,95,20,RED)+foot(107)+foot(193)
        main=p('M97 114q-1-34 34-32 17-31 45-4 37-5 34 34 40 11 21 42 23 38-10 54-5 38-43 28-35 32-55 0-41 8-41-26-39-20-10-48-15-34 25-48Z',PAPER)
        front=line('M96 119q3-28 31-24m48-4q28-5 27 24M89 189q-8 26 26 32m72 0q29 2 26-27',ORANGE,4)
        if s:front+=c(105,175,15,ORANGE)+c(195,175,15,ORANGE)
        if s==2:front+=line('M126 196v33m23-36v39m22-34v30m-53-20h61m-60 13h61',RED,2.5)
    elif slug=='mintotto':
        for side in [-1,1]:
            back+=group(p('M0 0q-30-92-88-86-26 53 11 103 38 38 77-17Z',GREEN)+line('M-5-2-65-61m33 35-24 1m9-16 1-23',PAPER,3),f'translate(150 161) scale({-side} 1)')
            if s==2:back+=group(p('M0 0q-78 3-66 65 50 7 66-65Z',TEAL)+line('M-4 11-48 49',PAPER,3),f'translate(150 165) scale({-side} 1)')
        main=e(150,171,24,68,YELLOW)+e(150,123,39,31,PAPER)
        front=line('M134 96q-30-32-34-11m65 10q28-33 37-12',INK,4)
        f=face(150,125)
        if s:front+=line('M134 180h32m-30 20h27m-22 18h15',INK,3)
    elif slug=='cacaoro':
        back=p('M188 224q82 20 74-89-58-2-66 59Z',ORANGE)+foot(110)+foot(189)
        main=p('M95 207q-20-45 18-69-30-46 7-57 31-17 67 25l33 30-34 45q24 58-2 65-61 21-89-39Z',b)+p('M118 105 72 139l-27 27 18 15 65-37Z',PAPER)
        front=line('M139 91q-15 64 6 146m27-127q-14 57-2 124',INK,3)
        f=face(159,131)
        if s:front+=line('M219 213q9-47 27-61',PAPER,4)
        if s==2:front+=p('M113 181q-28 13-13 48l13-10 11 2-4-38m70 0q28 20 8 48l-9-14-10 6Z',BLUE)
    elif slug=='tsukimo':
        back=foot(104)+foot(193)+c(86,105,22,b)+c(214,105,22,b)
        if s:back+=p('M202 230q73 6 50-72 37 17 27 59-4 50-66 32Z',b)
        main=p('M78 141q-8-58 66-47 74-22 84 40l-9 74q-13 58-75 38-54 12-68-38Z',b)
        front=p('M165 180q-29 18-5 46-45 8-45-24 0-27 50-22Z',YELLOW)
        f=face(150,145,light=True)
        if s==2:front+=star(99,191,9,YELLOW)+star(198,188,7,YELLOW)
    elif slug=='mitsuru':
        back=p('M216 176 271 126l-9 88Z',TEAL)
        main=p('M62 174Q60 104 146 102q79-9 90 62-7 68-88 71-78 3-86-61Z',INK)
        front=line('M144 110q-25-62 23-59',YELLOW,6)+c(180,52,14+s*4,YELLOW)+e(155,205,44,15,RED)
        f=face(143,160,light=True)
        if s:back+=p('M109 115l23-43 20 45m-25 105 15 37 29-31Z',BLUE)
        if s==2:front+=line('M241 170l18-26m-18 29 15 16',PAPER,3)+c(178,51,8,PAPER)
    elif slug=='ankoro':
        if s:back+=p('M96 127 49 78 64 233l55 4 28 22 31-22 57-3 13-156-49 49Z',PAPER)
        back+=foot(102)+foot(199)+p('M183 227q74 8 48 43-28 18-51-27Z',RED)
        main=e(150,191,62,64,b)+c(96,95,21,b)+c(205,95,21,b)+e(150,136,76,56,b)+e(150,154,49,27,PAPER)
        front=c(147,108,7,PAPER,'none')
        if s==2:front+=line('M61 103l41 72m137-72-41 72M74 223l31-25m126 25-30-25',RED,4)
    elif slug=='ramunon':
        for i in range(2+s*2):back+=line(f'M{98+i*(104/(1+s*2)):.1f} 185q-20 25 4 44t-2 40',TEAL if i%2 else BLUE,9)
        main=p('M65 174q-1-91 85-92 87 2 85 92-21 28-41 5-27 28-47 0-22 23-45 0-21 22-37-5Z',b)
        front=c(109,113,8,PAPER,INK,2)+c(137,104,5,PAPER,INK,2)+c(194,122,6,PAPER,INK,2)
        f=face(150,148,light=True)
        if s==2:front+=r(129,55,41,35,TEAL,4)+e(150,56,25,8,PAPER)
    elif slug=='yorucha':
        for i in range(1+s):back+=p(f'M204 219q{77-i*9} {31-i*27} {44-i*7} {-55-i*18}q-10 43-54 35Z',GREEN)
        back+=leaf(111,112,29,GREEN,-20)+leaf(190,112,31,GREEN,20)+foot(110)+foot(188)
        main=p('M81 131q3-49 68-33 71-13 72 35l-40 54 27 57q-64 22-116-1l24-60Z',GREEN)+p('M86 147l64 22 67-21-39 48h-57Z',PAPER)
        f=face(150,136,light=True)
        if s:front+=leaf(150,226,20,PAPER)
        if s==2:front+=line('M98 84l15 19m88-20-15 18',PAPER,3)
    elif slug=='suirenne':
        back=foot(108)+foot(188)+p('M196 221q69 38 62-20-30-30-66-1Z',TEAL)
        for i in range(1+s*2):back+=group(p('M0 0q-39-31-22-64 37 5 39 54Z',PINK),f'translate(150 169) rotate({(i-s*2/2)*31-31})')
        main=p('M100 147q-25-49 10-58 39-25 71 0 40 10 18 59l-29 35q47 7 38 62-57 30-113-1-17-53 33-65Z',TEAL)
        front=e(149,140,49,30,PAPER)+p('M120 194q31-18 59 0l-10 43h-35Z',PAPER)
        f=face(150,130)
        if s==2:front+=line('M215 218l27-8m-13 12 17 11',PAPER,3)+p('M83 209 67 218l16 11 15-12m110-8 21 12-18 9-16-11Z',TEAL)
    else: raise ValueError(slug)
    content=back+main+front+f
    return e(150,276,64+s*9,6,INK,'none',opacity='.12')+content


STAGE_NAMES = ['うまれたて', 'ちびっこ', 'わんぱく', 'おとな', 'とっておき']

# These are anatomical stages, not resized exports. The first stage is the
# ingredient itself; the next two have their own head/body and limb paths.
SEED_NOTES = {
 'komepi':'ひと粒のお米に目が開く。羽も足もまだない。',
 'kabun':'小さなかぶの種から、一本だけ根がのぞく。',
 'nanari':'菜種の粒に、黄いろい芽がひとつ。',
 'ichiri':'いちごの種から双葉が開き、顔がのぞく。',
 'soramame':'さやからこぼれた一粒のそら豆。',
 'himari':'しましまのひまわりの種に、小さな顔。',
 'kurune':'割れかけた栗の実。白い栗座がおなかになる。',
 'shiipo':'きのこの胞子から生まれた、一本足の丸い芽。',
 'waramo':'くるりと巻いたわらびの芽。尾も手もまだない。',
 'donguri':'小さなどんぐり。殻帽の下から目が開く。',
 'kuruwu':'くるみのひとかけら。殻の割れ目が眉になる。',
 'takenon':'地面から出たばかりの、三角のたけのこ。',
 'wakarun':'しずくを抱いた一枚のわかめ。ひれはまだない。',
 'hotape':'閉じた小さなほたて貝に、二つの目。',
 'shiochi':'四角い塩の結晶が、ころんと目を覚ます。',
 'konburuu':'水を含んでほどけはじめた、ひと巻きの昆布。',
 'aosaya':'水面に浮かぶ、小さなあおさのかけら。',
 'kohakani':'琥珀色の小さな巻き貝。脚はまだない。',
 'papriko':'一粒のパプリカの種から、へたの芽が出る。',
 'renpuku':'薄いれんこんの一節。穴の間に顔がある。',
 'negin':'ねぎの白い種根から、一本の葉がのぞく。',
 'caroron':'にんじんの種に、小さな房葉が生える。',
 'nasumii':'なすの種に、紫色の小さな芽がふくらむ。',
 'poncoro':'平たいかぼちゃの種。縁取りの中に顔がある。',
 'pururin':'カラメルを一粒のせた、丸いプリンのしずく。',
 'moffuru':'ぷくっとふくらんだ生地に、初めての格子がつく。',
 'panri':'一巻きのパン生地。まだ殻にも足にもなっていない。',
 'monaro':'小さなもなかの皮に、あんこの顔がのぞく。',
 'mintotto':'顔のついた一枚のミントの新芽。',
 'cacaoro':'割れたカカオの種。殻の中はやわらかな白色。',
 'tsukimo':'さつまいもの小さな芽いも。黄色い断面が目印。',
 'mitsuru':'琥珀を閉じ込めた、一滴の黒みつ。',
 'ankoro':'小さな白いへそを持つ、一粒の小豆。',
 'ramunon':'ラムネのしずくに、小さな泡がひとつ。',
 'yorucha':'くるんと丸まった一枚の茶葉。',
 'suirenne':'水に浮かぶ睡蓮の花芽。花びらはまだ閉じている。',
}


def little_face(x,y,light=False):
    col=PAPER if light else INK
    return c(x-13,y,3.5,col,'none')+c(x+13,y,3.5,col,'none')+line(f'M{x-5} {y+12}q5 5 10 0',col,2.5)


def seed_art(slug,b,a):
    art=''; top=167; light=False
    if slug=='komepi': art=p('M124 173q37-31 53 13 21 62-17 76-41 5-41-43Z',PAPER)+line('M132 185q-13 28-2 48',YELLOW,3)
    elif slug=='kabun': art=e(150,216,43,43,ORANGE)+p('M145 256q-8 21 11 16',PAPER)+leaf(150,176,11,GREEN)
    elif slug=='nanari': art=c(150,220,40,YELLOW)+line('M150 180v-12',GREEN,4)+e(162,166,16,8,GREEN);top=174
    elif slug=='ichiri': art=p('M113 219q9-54 36-54 38 1 39 57l-32 40q-37 0-43-43Z',YELLOW)+leaf(149,169,12,GREEN,-45)+leaf(149,169,12,GREEN,45)
    elif slug=='soramame': art=p('M112 181q-20 19-4 60 11 31 51 20 48-14 29-45-14-18-25-9 7-32-18-36Z',GREEN)+line('M125 218q11-19 33-11',YELLOW,4);light=True
    elif slug=='himari': art=p('M150 158q-52 38-37 75l37 34 34-33q23-39-34-76Z',ORANGE)+line('M128 177q-7 35-2 64m49-63q7 35-1 65',PAPER,8);top=158
    elif slug=='kurune': art=p('M111 210q-4-30 38-45 44 16 45 47l-11 36h-66Z',ORANGE)+p('M117 244q33-12 66 0v10q-35 23-66 0Z',PAPER)
    elif slug=='shiipo': art=r(130,216,40,45,PAPER,17)+p('M104 211q1-51 46-51 47 0 49 51-41 24-95 0Z',RED)+c(125,186,7,PAPER)+c(169,180,10,PAPER);top=162
    elif slug=='waramo': art=p('M137 262v-28q-44-11-35-48 10-45 59-24 34 29 5 54-27 15-40-9 0-21 20-17-12 12 1 13 20-9 5-24-31-13-33 15-1 20 35 24v45Z',GREEN);top=163;light=True
    elif slug=='donguri': art=p('M114 204q-6 48 36 63 47-20 38-65Z',ORANGE)+p('M106 200q7-44 44-43 41 1 46 43-49 19-90 0Z',GREEN)+line('M151 157v-13',INK,6);top=157
    elif slug=='kuruwu': art=p('M148 174q-31-24-43 16-18 57 28 68l18-9 19 9q44-11 27-62-12-43-44-22Z',ORANGE)+line('M151 179v61M119 188l10 12-12 18m65-30-10 12 12 18',PAPER,4)
    elif slug=='takenon': art=p('M150 153 104 246q44 24 92 0Z',GREEN)+p('m120 212 30-14 30 14-30 10Zm-12 27 42-16 42 16-42 14Z',YELLOW);top=155
    elif slug=='wakarun': art=p('M136 159q-35 12-19 34-19 21 1 34-22 27 11 37l49-10q-13-15 5-32-16-15 1-34-28 0-22-29Z',GREEN)+line('M146 179v64',TEAL,5);top=163;light=True
    elif slug=='hotape': art=p('M118 255q-50-54-14-78 23-18 46-7 27-14 48 10 35 40-20 78Z',PAPER)+line('M139 253l-22-72m43 70 22-67m-33 59v-65',RED,3);top=171
    elif slug=='shiochi': art=p('M115 180 167 166l25 23v58l-54 16-23-22Z',PAPER)+p('M167 167v56l25 24v-58Z',TEAL)+line('M117 182l23 22 27-36m-27 37v54',BLUE,3);top=177
    elif slug=='konburuu': art=p('M122 258q-36-65 5-89 43-21 65 20 18 42-24 45-35-5-15-28 14-7 13 8 18-2 8-20-29-14-40 10-13 20 13 54Z',GREEN)+line('M133 249q-22-29-11-49',YELLOW,3);top=172;light=True
    elif slug=='aosaya': art=p('M106 194 119 169l27 13 31-14 22 23-11 29 6 28-37 14-26-16-30 6 14-29Z',TEAL)+line('M121 194l58 43m-26-53-2 60',GREEN,3)
    elif slug=='kohakani': art=p('M110 242q-17-80 40-79 61 1 49 67l-36 31Z',ORANGE)+line('M177 238q-55-2-43-37 9-23 29-8 18 17-6 23',PAPER,5);top=167
    elif slug=='papriko': art=e(150,220,40,46,PAPER)+leaf(152,177,14,GREEN,26)+line('M117 221q-7 24 14 32',YELLOW,3);top=177
    elif slug=='renpuku':
        art=e(150,218,51,44,PAPER)
        for x,y in [(128,188),(170,190),(112,216),(190,219),(133,250),(166,249)]: art+=e(x,y,6,8,ORANGE,INK,2)
        top=177
    elif slug=='negin': art=p('M127 194v-45h23v-15h20v61q24 44-11 67-39 1-40-31Z',PAPER)+p('M126 187v-39h24v-14h21v53Z',GREEN)+line('M136 260l-6 14m21-11v12m10-13 9 11',ORANGE,3);top=184
    elif slug=='caroron': art=p('M121 187q29-20 57 0l-17 74-24 5Z',ORANGE)+leaf(148,180,13,GREEN,-27)+leaf(148,180,15,GREEN,21)+line('m125 210 12-3m26 28 11-3',INK,3);top=187
    elif slug=='nasumii': art=p('M138 168q-30-7-34 32-15 53 40 65 55-7 50-52-1-45-42-45Z',PURPLE)+p('m128 176 3-22 20 12 14-13 13 23-23 10Z',GREEN);light=True;top=173
    elif slug=='poncoro': art=p('M150 162q-50 32-47 63 2 31 45 41 47-8 50-36 1-32-48-68Z',PAPER)+p('M150 179q-34 28-33 49 1 21 32 24 31-6 34-23-2-22-33-50Z',YELLOW);top=168
    elif slug=='pururin': art=p('M131 176q-14 18-24 58-4 32 43 31 46 1 42-31l-22-58Z',YELLOW)+e(150,177,21,11,ORANGE);top=175
    elif slug=='moffuru': art=r(106,179,89,82,YELLOW,32)+line('M133 185v70m32-70v70m-52-47h73m-74 25h75',ORANGE,5);top=183
    elif slug=='panri': art=p('M107 204q-1-30 40-37 50-1 51 43-1 55-48 54-43-1-43-36 6-27 30-22 24 7 8 26-14 3-11-9',ORANGE)+line('M120 182q7 8 13 11m46-9-9 12',PAPER,4);top=174
    elif slug=='monaro': art=c(150,218,48,PAPER)+c(150,218,37,ORANGE)+line('M121 197h58m-63 20h68m-61 20h59m-39-49v61m19-61v61',PAPER,3);top=173
    elif slug=='mintotto': art=p('M150 265q-67-48-23-105 65-3 66 47-2 36-43 58Z',GREEN)+line('M147 249l9-72m-9 58-25-19m28 2 27-19',PAPER,3);light=True;top=162
    elif slug=='cacaoro': art=p('M112 194q19-42 55-30 37 21 31 53-11 43-56 50-50-29-30-73Z',ORANGE)+p('M136 180q37-13 43 26-5 34-35 42-23-26-8-68Z',PAPER);top=171
    elif slug=='tsukimo': art=p('M104 206q-2-28 32-31l36-12q33 4 26 40l-17 53q-12 26-39 5-37-19-38-55Z',PURPLE)+e(151,218,27,31,YELLOW);top=176
    elif slug=='mitsuru': art=p('M151 159q-8 26-33 48-35 48 18 61 59 12 64-31 0-33-49-78Z',INK)+c(166,199,12,YELLOW);light=True;top=171
    elif slug=='ankoro': art=p('M107 213q-1-47 38-46 49-5 49 52-1 48-43 48-46-1-44-54Z',RED)+e(155,179,16,5,PAPER,'none');top=173
    elif slug=='ramunon': art=p('M151 158q-6 27-33 54-25 45 15 55 57 16 65-28 0-30-47-81Z',BLUE)+c(163,196,10,PAPER)+c(141,182,4,PAPER);top=174;light=True
    elif slug=='yorucha': art=p('M111 204q-10-51 39-39 51-15 44 40-7 30-44 61-39-23-39-62Z',GREEN)+line('M151 255v-73m1 35-25-23m25 39 23-27',PAPER,3);top=172;light=True
    elif slug=='suirenne': art=e(151,256,54,16,TEAL)+p('M111 213q1-37 22-49l17 22 18-23q23 16 23 51l-38 43Z',PINK)+line('M149 187l4 56',RED,3);top=175
    else: raise ValueError(slug)
    return e(150,276,41,5,INK,'none',opacity='.12')+art+little_face(150,221,light), (150,top,.48)


def young_art(slug,stage,b,a):
    """Stage 1 sits as one round body; stage 2 stands, walks or opens its wings."""
    grown=stage==2
    head_y=135 if grown else 179
    back=''; front=''; detail=''; col=b
    feet=(e(112,254,20,11,a)+e(188,254,20,11,a)) if grown else (e(127,258,13,7,a)+e(173,258,13,7,a))
    if grown:
        base=e(150,218,45,40,b)+e(150,143,63,54,b)
        hands=p('M110 201q-35-12-32 10 1 17 32 13m79-21q31-20 36 0 7 21-33 23Z',b)
    else:
        base=p('M94 198q-4-65 55-65 61 0 58 64l-8 38q-48 45-97 0Z',b)
        hands=''
    head=(150,88 if grown else 134,.72 if grown else .64)
    fy=142 if grown else 186
    if slug=='komepi':
        back=(p('M109 220 61 208l13-27 37 3m77 34 49-26-23-21-32 13Z',PAPER) if grown else p('M101 218 83 234l29-1m80-15 24 16-29 4Z',PAPER))
        front=p(f'M135 {fy+26}l15-19 17 19v22h-32Z',INK)+p(f'M143 {fy+10}h15l-7 10Z',YELLOW)
    elif slug=='kabun':
        back=leaf(150,head[1]+3,26 if grown else 15,GREEN,-22)+leaf(150,head[1]+3,23 if grown else 12,GREEN,25)
        back+=p('M149 250q-23 27 7 26-5-9 9-18Z',PAPER)
        hands=p('M108 204q-29-9-30 19l24 7m87-25q31-11 33 16l-25 10Z',ORANGE) if grown else ''
        front=line('M122 226h11m34 10h12',ORANGE,3)
    elif slug=='nanari':
        back=p(f'M111 {head[1]+14}q-38-41-15-45l26 34m66 11q35-41 15-45l-26 34Z',YELLOW)
        if grown: base=e(152,225,53,29,YELLOW)+r(125,143,49,83,YELLOW,20)+e(150,127,50,40,YELLOW);head=(150,88,.59);fy=126
        front=flower(111,201,11,PAPER)+flower(181,201,11,PAPER) if grown else flower(182,224,10,PAPER)
    elif slug=='ichiri':
        back=leaf(126,head[1]+15,33 if grown else 17,GREEN,-14)+leaf(177,head[1]+15,33 if grown else 11,GREEN,15)
        front=''.join(p(f'M{x} {y}l3-5 3 5-3 5Z',YELLOW,'none') for x,y in ([(116,119),(188,120),(120,183),(179,185),(149,224)] if grown else [(117,165),(183,164),(146,226)]))
        if grown:feet=e(106,247,30,16,RED)+e(199,247,30,16,RED)
    elif slug=='soramame':
        if grown:
            back=e(183,205,63,43,GREEN)+c(157,199,23,YELLOW)+c(202,205,23,YELLOW)
            base=p('M55 145q-12-51 22-53 38 12 18 54l-13 68q76-2 130 17l34 25q-104 26-190-13Z',YELLOW)
            front=line('M60 102 43 72m40 25 18-28',INK,4)+c(43,72,5,GREEN)+c(101,69,5,GREEN)
            return e(150,276,78,6,INK,'none',opacity='.12')+back+base+front+little_face(74,132),(75,98,.40)
        back=e(157,211,55,49,GREEN)+c(169,206,27,YELLOW)
        base=p('M108 254q-13-37 14-41 28 2 28 34l25 13-51 8Z',YELLOW)
        front=line('M117 217l-9-13m22 9 7-15',INK,3)+c(108,204,4,GREEN)+c(137,198,4,GREEN)
        return e(150,276,58,6,INK,'none',opacity='.12')+back+base+front+little_face(123,242),(124,217,.30)
    elif slug=='himari':
        if grown:
            back=''.join(group(p('M-10-25q-16-33 7-47 25 15 13 47Z',YELLOW),f'translate(145 137) rotate({i*35-52})') for i in range(4))
            base=p('M115 167q-24 45-19 76 46 33 91 1l-16-74Z',ORANGE)+p('M107 138q-2-45 49-35 23 8 34 29l23 9-19 27-52 12Z',PAPER)+p('M122 177q-7 39 8 70h29l7-76Z',PAPER)
            front=c(209,144,6,INK)+line('M109 190l-19 58m87-58 18 58',ORANGE,12)
            return e(150,276,61,6,INK,'none',opacity='.12')+back+feet+base+front+little_face(160,142),(156,103,.62)
        back=p('M100 218l-7-24 24 9 12-28 21 18 20-16 17 37Z',YELLOW)
        base=e(141,234,60,30,ORANGE)+p('M158 214q30-13 43 10l18 9-9 20-31 11-41-9Z',PAPER)
        return e(150,276,62,6,INK,'none',opacity='.12')+back+base+c(216,236,5,INK)+little_face(181,238),(181,215,.44)
    elif slug=='kurune':
        back=p('M194 237q67 10 48-83-41-20-51 20 35-3 3 63Z',GREEN) if grown else e(204,229,28,29,GREEN)
        back+=p(f'M106 {head[1]+22}l-7-36 28 20m48 0 28-20-9 36Z',ORANGE)
        front=p(f'M105 {fy+10}q42-24 90 0l-19 26h-51Z',PAPER)
    elif slug=='shiipo':
        base=p('M112 199v-52h78v64l-12 43h-57Z',PAPER) if grown else r(115,185,73,68,PAPER,27)
        back=p(f'M{72 if grown else 91} {head_y}q12-58 {78 if grown else 59}-58 {66 if grown else 55} 0 {78 if grown else 61} 58-73 29-{156 if grown else 120} 0Z',RED)
        front=c(124,head_y-26,9,PAPER)+c(178,head_y-33,12,PAPER)+p(f'M175 {head_y+26}q31-2 26 23-10 13-17-1l-12-5Z',PAPER)
        fy=head_y+28;head=(150,head_y-57,.68);hands=''
    elif slug=='waramo':
        back=p('M189 237q74 23 63-32-10-29-31-6 27-7 13 9-12 8-32-6Z',GREEN) if grown else line('M191 234q44 11 32-23-14-12-14 3',GREEN,12)
        back+=p(f'M184 {head[1]+30}l19-35 12 48 20-18 9 43Z',YELLOW)
        front=e(122,fy-3,15,22,PAPER)+e(182,fy-3,15,22,PAPER)
    elif slug=='donguri':
        back=p(f'M99 {head[1]+39}l-21-30 34 1m75 0 33-1-21 30Z',ORANGE)
        front=p(f'M{89 if grown else 98} {head[1]+16}q6-42 {61 if grown else 52}-40 {58 if grown else 49}-2 {62 if grown else 52} 40-61 20-{123 if grown else 104} 0Z',GREEN)+line(f'M150 {head[1]-22}v-16',INK,5)+e(150,fy+24,25,17,PINK)+e(142,fy+23,3,5,INK)+e(158,fy+23,3,5,INK)
    elif slug=='kuruwu':
        back=p('M109 187 50 174q-8 45 51 68m87-55 61-14q8 45-50 70Z',ORANGE) if grown else p('M104 213 86 231l26 6m75-25 25 19-28 8Z',ORANGE)
        front=e(125,fy,23,25,PAPER)+e(177,fy,23,25,PAPER)+p(f'M145 {fy+21}h13l-6 10Z',YELLOW)+line('M126 222l12 7 12-7 12 7 12-7',PAPER,3)
    elif slug=='takenon':
        back=c(99,head[1]+28,16,INK)+c(203,head[1]+28,16,INK)+(leaf(197,239,26,GREEN,65) if grown else '')
        front=e(125,fy,17,22,INK)+e(178,fy,17,22,INK)+p(f'M113 {head[1]+9}l38-42 37 42-37-8Z',GREEN)+e(151,225,26,23,PAPER)
        if grown:front+=p('M123 75l28-27 27 27-27-5Z',GREEN)
    elif slug=='wakarun':
        back=c(104,head[1]+25,15,GREEN)+c(197,head[1]+25,15,GREEN)+p('M183 239q59-9 48 18-31 24-57-12Z',GREEN)
        front=e(150,fy+17,34,21,PAPER)+p(f'M106 {fy+45}l17-12 18 13 19-12 23 14 10-10 8 25-20 8-26-8-29 9-24-8Z',TEAL)
    elif slug=='hotape':
        if grown:
            back=p('M127 249Q56 218 81 99q82 20 71 129Z',PAPER)+line('M126 224 93 120m34 103 5-91',RED,3)+p('M137 242q59-88 124-87-1 69-90 104Z',PAPER)+line('M161 241l81-70m-67 77 67-39',RED,3)
            base=p('M106 228q47-18 89 12l42 14-18 12-86-4-31-13Z',PAPER)+e(158,213,43,34,PAPER)
            front=p('M137 235 107 265l28 5 28-20m15-14 32 25 24-11-33-16Z',RED)
            return e(150,276,74,6,INK,'none',opacity='.12')+back+base+front+little_face(159,214),(158,180,.52)
        back=p('M92 202q-43-99 56-117 98 22 61 117Z',PAPER) if grown else p('M106 220q-29-68 44-86 72 18 45 86Z',PAPER)
        back+=line('M150 204 101 117m49 81V95m0 105 49-80',RED,3) if grown else line('M150 219v-73',RED,3)
        base=e(150,210,55,46,PAPER);fy=206;head=(150,165,.66)
        hands=p('M103 220 75 236l17 10 28-13m67-14 36 19-19 8-30-17Z',RED)
    elif slug=='shiochi':
        front=e(150,211,35,35,PAPER)+e(150,fy,34,31,PAPER)+p(f'M142 {fy+15}h16l-8 10Z',YELLOW)+r(141,head[1]-16,20,28,TEAL,2)
        hands=p('M104 190 77 214l21 20 13-27m84-19 29 27-22 20-14-29Z',BLUE)
        if grown:front+=r(123,head[1]-5,16,20,PAPER,2)+r(164,head[1]-5,16,20,PAPER,2)
    elif slug=='konburuu':
        back=p('M184 237q80 25 52-24-17-22-22 0 15-6 13 5-9 9-34-1Z',GREEN)+(p('M190 207q71-33 39-102-18 52-44 63Z',TEAL) if grown else leaf(193,215,25,TEAL,55))
        front=e(149,223,26,28,YELLOW)+p(f'M104 {head[1]+24}l5-32 23 18m36 0 24-19 5 31Z',GREEN)
    elif slug=='aosaya':
        if grown:
            back=line('M150 243q-21 31 14 35',GREEN,7)
            base=p('M150 91 114 134l-25 62 18 57 44 16 44-16 18-57-27-63Z',TEAL)
            front=p('M112 139 150 168l-8 85-36-15-6-38Zm77 0-39 29 8 85 34-15 9-38Z',GREEN)+p('M123 163q27-27 55 0l-28 35Z',PAPER)
            return e(150,283,42,5,INK,'none',opacity='.12')+back+base+front+little_face(150,169),(150,100,.51)
        base=p('M150 108 66 176 45 226l66-4 39 33 42-34 63 6-20-50Z',TEAL) if grown else p('M150 147 95 202l-10 38 40-10 25 26 26-26 43 11-14-39Z',TEAL)
        back=line('M151 243q-2 37 43 26',GREEN,7)
        front=p('M103 209q44-42 93 0l-45 33Z',PAPER);fy=192 if grown else 217;head=(150,139 if grown else 174,.58);hands='';feet=''
    elif slug=='kohakani':
        back=e(150,175,56 if grown else 43,58,ORANGE)+line('M175 200q-62-7-33-48 34-16 28 21-16 13-20-2',PAPER,4)
        base=e(150,237,57,25,RED);fy=228;head=(150,214,.57);feet='';hands=''
        back+=line('M105 234l-30 17-5 14m51-26-12 29m75-26 17 26m-3-34 30 17 5 14',RED,7)
        front=p('M102 220q-43-8-33-38l16 13 14-16q16 28 3 41m97 0q42-8 32-38l-16 13-14-16q-16 28-2 41Z',RED) if grown else p('M107 233 84 215l-2 20m110 0 21-20 5 20Z',RED)
    elif slug=='papriko':
        back=p(f'M108 {head[1]+25}l-9-39 35 25m31 0 36-26-9 42Z',GREEN)+line('M195 239q50 15 38-22-8-14-17 0',GREEN,10)
        front=line(f'M112 {fy+43}q-8 26 12 53m64-53q7 26-13 53',INK,3)
    elif slug=='renpuku':
        back=''.join(e(x,y,20,9,PINK,INK,3,transform=f'rotate({rot} {x} {y})') for x,y,rot in ([(87,122,25),(87,154,-20),(216,123,-25),(214,155,20)] if grown else [(100,160,20),(200,160,-20)]))
        front=c(139,226,5,INK)+c(162,238,5,INK)
        if grown:back+=p('M189 240q51-27 56 10-34 15-47 1Z',TEAL)
    elif slug=='negin':
        back=p(f'M113 {head[1]+8}l-3-{50 if grown else 30} 19-9 9 {59 if grown else 39}m24 0 7-{57 if grown else 27} 20 10-9 {47 if grown else 17}Z',GREEN)+p('M184 239q71-10 46-48 39 45-9 72l-35-9Z',PAPER)
        front=e(150,225,23,28,YELLOW)+(line('M220 250l11 7m-15-21 18 2',GREEN,7) if grown else '')
    elif slug=='caroron':
        back=p(f'M105 {head[1]+27}l-5-{55 if grown else 32} 33 {36 if grown else 19}m32 0 38-{36 if grown else 19}-5 {55 if grown else 32}Z',ORANGE)+leaf(190,246,31 if grown else 19,GREEN,69)
        front=p(f'M108 {fy+10}l42 18 41-18-21 32h-42Z',PAPER)+c(150,fy+28,5,INK)
    elif slug=='nasumii':
        back=p(f'M112 {head[1]+18}l-8-33 32 25m29 0 31-25-7 33Z',PURPLE)
        hands=p('M109 196 42 147l8 72 23-8 16 25 21-18m80-22 67-50-9 73-23-8-16 25-22-18Z',GREEN) if grown else p('M103 205 79 193l10 34 18 3m86-25 30-12-12 34-18 3Z',GREEN)
        front=e(150,225,24,24,PAPER)+p(f'M128 {head[1]+5}l22-20 20 21-21 12Z',GREEN)
    elif slug=='poncoro':
        back=c(107,head[1]+16,17,GREEN)+c(196,head[1]+16,17,GREEN)+(line('M190 244q57 18 33-19',GREEN,12) if grown else '')
        front=p(f'M103 {fy-9}q20-15 47 12 25-27 48-12l-9 27-40-5-36 5Z',INK)+line('M131 215v37m38-37v36',INK,3)
    elif slug=='pururin':
        back=p(f'M109 {head[1]+28}q-34-15-30-29 31-5 43 17m57 12q33-18 29-31-29-4-42 19Z',YELLOW)
        if grown:back+=line('M125 102l-8-40m57 40 9-40',ORANGE,7);base=p('M115 163h69l23 89q-59 19-113 0Z',YELLOW)+e(150,141,55,44,YELLOW)
        front=p(f'M{98 if grown else 106} {head[1]+15}q48-30 {104 if grown else 91} 0l-7 22-25-3-24 12-19-12-22 5Z',ORANGE)
    elif slug=='moffuru':
        base=(r(109,177,81,78,YELLOW,21)+r(90,95,122,99,YELLOW,29)) if grown else r(96,141,109,114,YELLOW,36)
        back=p(f'M104 {head[1]+30}l-16-35 37 20m48 0 35-20-12 35Z',ORANGE)+(p('M183 226h47v30h-26v-14h11v-6h-32Z',ORANGE) if grown else '')
        front=line('M128 203v37m28-37v37m-41-25h61m-59 15h58',ORANGE,5) if grown else line('M119 210h63m-48-15v45m27-44v43',ORANGE,4)
    elif slug=='panri':
        if not grown:
            back=p('M105 214q-9-55 43-55 61-4 61 54 0 56-60 51-44-2-44-50Z',ORANGE)
            front=line('M129 164q-19 21-14 44m39-46q-8 28 9 41m20-29q22 26 8 67m-14 10-14 9',PAPER,5)+e(139,234,28,23,PAPER)
            return e(150,276,48,5,INK,'none',opacity='.12')+back+front+little_face(138,232),(140,212,.34)
        back=(p('M195 237 237 248l-30-36Z',ORANGE)+e(163,193,65,63,ORANGE)) if grown else e(167,217,46,42,ORANGE)
        base=p('M72 207q-17-38 27-45 30-4 45 25l9 57q-59 22-81-9Z',PAPER) if grown else p('M91 225q-7-41 30-39 39 7 29 44l-17 27-35-13Z',PAPER)
        front=line('M136 139q-19 56 8 106m17-111q-8 65 14 116m15-110q15 40 9 96',PAPER,5) if grown else line('M157 178q-9 43 9 76m14-72q12 29 9 66',PAPER,4)
        fy=199 if grown else 219;head=(102,162,.53) if grown else (120,186,.43);hands='';feet=e(104,256,18,10,ORANGE)+e(191,256,18,10,ORANGE)
        return e(150,276,74,6,INK,'none',opacity='.12')+back+feet+base+front+little_face(104 if grown else 120,fy),head
    elif slug=='monaro':
        back=c(107,head[1]+14,16,RED)+c(196,head[1]+14,16,RED)
        front=e(111,fy+22,17,15,ORANGE)+e(189,fy+22,17,15,ORANGE)+line('M134 218v30m20-30v30m19-30v30m-48-20h55m-56 14h55',RED,2.5)
    elif slug=='mintotto':
        back=(p('M137 194Q23 175 53 94q77 13 86 88m24 11q111-17 82-99-76 11-82 87Z',GREEN)+line('M137 181 68 110m96 72 67-70',PAPER,3)) if grown else (leaf(139,244,40,GREEN,-17)+leaf(162,244,40,GREEN,17))
        base=e(150,218,22,36,YELLOW)+e(150,167 if grown else 191,34,31,PAPER);fy=164 if grown else 190;head=(150,137 if grown else 162,.46);hands='';feet=''
        front=line(f'M139 {fy-28}l-12-20m38 20 13-20',INK,3)
    elif slug=='cacaoro':
        back=p('M190 233q61 16 43-65-50 8-43 65Z',ORANGE)
        front=p(f'M110 {fy+2} 73 {fy+22}l12 15 41-19Z',PAPER)+line('M132 210q-8 27 3 43m32-46q-5 28 4 45',INK,3)
    elif slug=='tsukimo':
        back=c(107,head[1]+12,21,PURPLE)+c(196,head[1]+12,21,PURPLE)+(p('M188 240q67-16 27-58 55 20 28 64l-42 15Z',PURPLE) if grown else c(199,238,22,PURPLE))
        front=p('M165 212q-27 13-8 34-36 7-35-18 4-22 43-16Z',YELLOW)
    elif slug=='mitsuru':
        if grown:
            back=p('M195 211 255 142l6 96-54 8Z',TEAL)+p('M121 168l26-45 30 64m-39 52 16 29 28-24Z',BLUE)
            base=p('M70 186q0-35 42-30l64 29 42 37-12 31q-77 23-135-23Z',INK)
            front=line('M99 158q-32-51 5-67',YELLOW,4)+c(112,92,17,YELLOW)+line('M227 207l20-37m-17 48 18 8',PAPER,3)
            return e(150,276,75,6,INK,'none',opacity='.12')+back+base+front+little_face(107,194,True),(111,158,.51)
        back=p('M197 199 247 164l-9 78Z',TEAL)
        base=e(150,207,62,48,INK);fy=201;head=(150,162,.70);hands='';feet=''
        front=line('M146 162q-14-52 22-50',YELLOW,4)+c(178,114,17,YELLOW)+(p('M120 163l16-32 18 32m-16 83 10 21 25-24Z',BLUE) if grown else '')
    elif slug=='ankoro':
        back=(p('M111 180 59 131l14 116 76 17 78-18 14-115-53 49Z',PAPER) if grown else p('M105 208 79 224l31 16m82-32 29 16-30 16Z',PAPER))
        back+=c(107,head[1]+14,18,RED)+c(196,head[1]+14,18,RED)+p('M177 240q55 6 26 29l-25-12Z',RED)
        front=e(150,fy+17,33,23,PAPER);hands=''
    elif slug=='ramunon':
        if grown:
            back=''.join(line(f'M{x} 217q-15 19 0 35t-2 24',TEAL if i%2 else BLUE,7) for i,x in enumerate([117,139,161,183]))
            base=p('M123 101q27-20 54 0l11 50 27 58-26 15-18-13-21 17-23-17-19 13-24-15 27-58Z',BLUE)
            front=c(137,118,6,PAPER)+c(169,145,8,PAPER)+c(117,175,4,PAPER)+line('M110 204q40-15 79 0',TEAL,4)
            return e(150,285,49,5,INK,'none',opacity='.12')+back+base+front+little_face(150,181,True),(150,104,.42)
        base=p('M89 192q0-77 61-77 64 1 64 77l-21 19-23-13-20 14-22-14-20 13Z',BLUE) if grown else p('M103 219q0-73 47-73 50 1 50 73l-18 12-17-10-15 12-17-12-15 10Z',BLUE)
        back=''.join(line(f'M{x} 215q-18 23 2 45',TEAL,7) for x in ([114,138,162,186] if grown else [132,168]))
        front=c(128,147 if grown else 171,6,PAPER)+c(162,136 if grown else 159,5,PAPER);fy=180 if grown else 203;head=(150,116 if grown else 149,.61);feet='';hands=''
    elif slug=='yorucha':
        back=leaf(112,head[1]+25,26 if grown else 17,GREEN,-16)+leaf(190,head[1]+25,26 if grown else 17,GREEN,16)+p('M190 240q76 5 43-64-8 43-44 42Z',GREEN)
        front=p(f'M105 {fy+11}l45 18 45-18-23 32h-45Z',PAPER)
        if grown:front+=leaf(150,250,19,PAPER)
    elif slug=='suirenne':
        back=p('M184 240q62 16 47-25-29-20-47 5Z',TEAL)
        back+=''.join(group(p('M-12 0q-14-25 3-41 22 10 22 38Z',PINK),f'translate(150 {fy+33}) rotate({angle})') for angle in ([-65,0,65] if grown else [0]))
        base=base.replace(b,TEAL);front=e(150,fy+16,36,22,PAPER)+e(150,227,22,24,PAPER)
    else:raise ValueError(slug)
    light=slug in {'nasumii','poncoro','tsukimo','mitsuru','ramunon','yorucha'}
    expression=little_face(150,fy,light) if not grown else face(150,fy,light=light)
    if slug=='takenon': expression=little_face(150,fy,True) if not grown else face(150,fy,light=True)
    return e(150,276,61 if grown else 48,6,INK,'none',opacity='.12')+back+feet+base+hands+front+expression,head


YOUNG_NOTES = {
 'komepi':('丸いひなに短い羽と足が生え、胸には小さな海苔模様。','頭と胴が分かれ、横へ開いた羽で羽ばたく練習をする。'),
 'kabun':('小さな葉と短い根を持つ、丸いかぶの幼体。','頭の葉が広がり、橙色の前足で土を掘りはじめる。'),
 'nanari':('短い首と細い耳の子。胸に一輪の花が咲く。','首と脚が伸び、左右の肩に花が咲く。'),
 'ichiri':('ころんとした実に、小さな二枚の葉耳が生える。','頭と胴が分かれ、長い葉耳と大きな後ろ足で跳ねる。'),
 'soramame':('一粒の殻に隠れ、丸い顔だけを入口からのぞかせる。','二粒の殻を背負い、長い首をまっすぐ上へ伸ばす。'),
 'himari':('低く伏せた丸い幼体。小さな鼻と短い花びらがのぞく。','細長い胴を起こし、前足で立つ。鼻先と背の花びらが伸びる。'),
 'kurune':('栗形の頭と短い丸尾を持つ。胸の白い栗座が目印。','頭と胴が分かれ、抱えこめる大きな尾と前足が育つ。'),
 'shiipo':('小さな傘から、丸い顔と短い鼻を出す。','傘の下で胴が長く伸び、曲がる鼻と足で歩く。'),
 'waramo':('丸い体に大きな目が開き、短い巻き尾が生える。','胴と四肢が育ち、長い巻き尾を振って立ち上がる。'),
 'donguri':('どんぐり帽の下に、丸い鼻と短い足が生える。','頭と胴が分かれ、前足と帽子の下の縞模様が育つ。'),
 'kuruwu':('丸い体に大きな二つの目。短い羽を閉じて座る。','頭と胴が分かれ、短い翼を横へ開いて飛ぶ練習をする。'),
 'takenon':('一段のたけのこ頭と、丸い耳を持つ小さな子。','二段の帽子と前足が育ち、笹の尾が伸びる。'),
 'wakarun':('短い尾と、ぎざぎざのわかめ襟を持つ丸い子。','頭と胴が分かれ、前足を広げて泳ぎはじめる。'),
 'hotape':('小さな扇の貝から顔を出し、短いひれを広げる。','貝を横向きに半分閉じ、長くなった体とひれを外へ伸ばす。'),
 'shiochi':('丸い体に白い顔とおなか。一粒の結晶を頭にのせる。','頭と胴が分かれ、角ばった羽と三つの結晶が育つ。'),
 'konburuu':('丸い体に一枚の昆布ひれ。短い尾をくるりと巻く。','頭と胴が分かれ、大きな背びれと手足で泳ぎはじめる。'),
 'aosaya':('小さな三角の翼と、短く曲がる尾を持つ。','翼を体の前にたたみ、縦長の姿で流れをくぐり抜ける。'),
 'kohakani':('丸い殻の下から顔を出し、短い脚でそっと歩く。','胴を起こし、左右のはさみを広げてしっかり立つ。'),
 'papriko':('丸い実に小さな葉耳と、巻いたへた尾が生える。','頭と胴が分かれ、前足と後ろ足でリズムをとる。'),
 'renpuku':('横に短い花えらを持ち、おなかに二つの穴模様がある。','四枚のえらと手足が育ち、蓮の葉の尾が現れる。'),
 'negin':('白い丸い体に、短いねぎ耳と小さな尾が生える。','頭と胴が分かれ、長い葉耳としましまの尾が育つ。'),
 'caroron':('小さな三角耳と白い口元、短い葉尾を持つ。','頭と胴が分かれ、立った耳と大きな房葉の尾で走る。'),
 'nasumii':('丸いなすの体に、短い葉翼と小さな耳が生える。','頭と胴が分かれ、左右の大きな葉翼を横へ開く。'),
 'poncoro':('ころんとした体に、目の周りの黒い模様が現れる。','頭と胴が分かれ、筋のあるおなかと巻きつる尾が育つ。'),
 'pururin':('丸い体に小さな耳。頭にはカラメルの模様がある。','胴がプリン形に伸び、二本の角と前足が育つ。'),
 'moffuru':('角の丸い格子の体に、小さな耳と足が生える。','頭と胴が分かれ、四角い巻き尾と前足が育つ。'),
 'panri':('パンの層を丸く巻いた幼体。殻の隙間から顔だけを出す。','殻をほどいて頭を高く起こし、短い脚と尾で歩きはじめる。'),
 'monaro':('丸いもなかにあんこの耳。ほっぺが小さくふくらむ。','頭と胴が分かれ、花色のほっぺと格子の腹が育つ。'),
 'mintotto':('二枚の葉翼を体に沿わせて閉じ、静かに座る。','上の葉翼を大きく横へ開き、細い胴で飛びはじめる。'),
 'cacaoro':('丸いカカオの体に、短い鼻と小さな尾が生える。','頭と胴が分かれ、鼻先と縦筋のある尾が伸びる。'),
 'tsukimo':('丸い耳と短い尾。おなかに小さな月が現れる。','頭と胴が分かれ、長い尾をくるりと立てて歩く。'),
 'mitsuru':('丸い黒みつの体に、短い灯りと小さな尾びれが生える。','頭から尾まで長く伸び、灯りを前に出して斜めに泳ぐ。'),
 'ankoro':('小豆の丸い頭と、白い口元。飛膜はまだ短い。','頭と胴が分かれ、両手と足をつなぐ白い飛膜が広がる。'),
 'ramunon':('丸い傘の下から、二本の短いリボンがのぞく。','傘が細長い瓶形になり、四本のリボンを下へ伸ばす。'),
 'yorucha':('短い茶葉耳と、ひと巻きの小さな尾を持つ。','頭と胴が分かれ、大きな尾と胸の葉飾りが育つ。'),
 'suirenne':('丸い体に一枚の花芽。水辺で尾を小さく揺らす。','頭と胴が分かれ、三枚の花えりと水かきの手が育つ。'),
}


SIGNATURE_NOTES = {
 'komepi':'細い脚で立つ稲穂の鳥へ。両翼が米粒の扇になり、三本の長い尾羽を広げる。',
 'kabun':'横に張った大きな根の体と、土を分ける四本の前爪。頭の葉が菜園の屋根になる。',
 'nanari':'首の長い四つ足のアルパカへ。背中にも菜の花が咲き、花の襟が一周つながる。',
 'ichiri':'細長い体で跳ねる大うさぎへ。二本の葉耳が帆のように伸び、花の尾が大きく開く。',
 'soramame':'アーチ形の長いさやを背負う旅のかたつむりへ。四粒の豆と長い触角が目印。',
 'himari':'大輪の花を丸ごと広げるハリネズミへ。鼻先が長くなり、葉の四つ足で歩く。',
 'kurune':'枝にとまる栗のリスへ。顔より大きないがの扇尾と、実を抱える長い前足を持つ。',
 'shiipo':'低い四つ足の大きなバクへ。長い鼻が地面に届き、二層のきのこが背を覆う。',
 'waramo':'横向きに歩く長胴のカメレオンへ。二重巻き尾と、枝分かれしたシダの背びれを持つ。',
 'donguri':'どっしりした横長のイノシシへ。大きなどんぐり兜と二本の牙で森を案内する。',
 'kuruwu':'大きく翼を開くフクロウへ。くるみの割れ目が風切羽にまで続き、足で枝をつかむ。',
 'takenon':'長い胴と広い肩のパンダへ。たけのこの冠が高く伸び、笹の腕で食卓を守る。',
 'wakarun':'背を水に預ける長いラッコへ。大きな尾で泳ぎ、胸に磨いた貝を大切に抱える。',
 'hotape':'翼のように貝を開くアザラシへ。長い胴と左右の大ひれで、海を滑るように泳ぐ。',
 'shiochi':'胸を張った背の高いペンギンへ。結晶の冠と階段状の翼が、氷の塔のように育つ。',
 'konburuu':'空を泳ぐ長い海竜へ。体が大きくうねり、四枚の昆布ひれと長い尾をなびかせる。',
 'aosaya':'空いっぱいに広がる大きなエイへ。幅広い菱形の翼と二股のあおさ尾を持つ。',
 'kohakani':'大ばさみで立つヤドカリへ。高い巻き貝と六本の脚、大きさの違う二つのはさみが育つ。',
 'papriko':'背筋を伸ばして踊るネコへ。三つ山の長い胴、葉のたてがみ、輪を描くへた尾を持つ。',
 'renpuku':'水面を泳ぐ長胴のウーパールーパーへ。六枚の花えらと、大きな蓮の葉の尾が開く。',
 'negin':'弓のように体を伸ばすフェレットへ。長い葉耳と四つ足、ねぎの節がある尾で駆ける。',
 'caroron':'四つ足で駆ける細身のキツネへ。にんじんの長い鼻と、房葉を束ねた大尾が育つ。',
 'nasumii':'左右に大きく葉翼を広げるコウモリへ。翼の先が五つに分かれ、長いなすの体が揺れる。',
 'poncoro':'二足で立つ大きなタヌキへ。丸いかぼちゃのおなかと、太い巻きつる尾が育つ。',
 'pururin':'すらりと立つ四つ足の鹿へ。枝分かれしたカラメルの角と、細い脚で静かに歩く。',
 'moffuru':'胸を張る四つ足の柴犬へ。格子の長い胴と四角い巻き尾、きりっとした耳が育つ。',
 'panri':'低い姿勢で歩く大きなアルマジロへ。半月の厚い殻と、節のある長い尾で身を守る。',
 'monaro':'花型の大きなもなかへ。頬より広い胴とあんこの前足で、花びら形のお皿を抱える。',
 'mintotto':'四枚の大翼を開く蛾へ。ミントの鋸歯と葉脈がはっきりし、長い触角が弧を描く。',
 'cacaoro':'長い鼻と太い尾で歩くアリクイへ。カカオの房のような胴と、強い前爪を持つ。',
 'tsukimo':'大きな尾にくるまるヤマネへ。丸い耳と月形のおなかを、焼きいも色の尾が囲む。',
 'mitsuru':'幅広いひれで浮く深海の魚へ。二本の灯りと透かし模様の大尾が、暗がりを照らす。',
 'ankoro':'四肢いっぱいに飛膜を広げるモモンガへ。小豆の尾が二段にふくらみ、空を大きく滑る。',
 'ramunon':'高い傘と長い六本のリボンを持つクラゲへ。ラムネ瓶の冠から泡が連なって浮かぶ。',
 'yorucha':'長い胴の茶葉ギツネへ。三つ又の大尾を扇に開き、茶葉の胸飾りを揺らす。',
 'suirenne':'睡蓮をまとう長い水竜へ。花の襟が大輪になり、葉の尾と四本の水かきで泳ぐ。',
}


def signature_art(slug,b,a):
    """New adult anatomy and pose per species; never an adult scale transform."""
    art=''; fx=150; fy=133; anchor=(150,88,.78)
    foot=lambda x,y=258,col=a:e(x,y,20,10,col)
    if slug=='komepi':
        art=p('M125 214 80 260l48-20-7 30 29-37 23 36-5-33 44 28-34-52Z',PAPER)
        art+=p('M115 176Q48 168 28 81l49 19-2-37 44 39 16 75m34-1q76-22 103-96l-54 19 8-36-54 40Z',PAPER)
        art+=line('M41 105l79 68M62 131l57 51m138-75-82 67m63-40-61 52',RED,4)
        art+=e(150,194,39,49,PAPER)+e(150,119,48,45,PAPER)+p('M136 169l14-22 18 24-7 42h-22Z',INK)+p('M143 140h14l-7 10Z',YELLOW)+line('M136 238v30h-18m47-30v30h18',RED,5)
        fy=119;anchor=(150,76,.6)
    elif slug=='kabun':
        art=''.join(leaf(150,113,43,GREEN,angle) for angle in [-65,-33,0,33,65])
        art+=p('M148 233q-50 42 15 41-13-13 9-29Z',PAPER)+p('M61 156q4-54 90-44 93-8 94 51 3 67-94 89-87-20-90-96Z',PAPER)
        art+=p('M79 185q-58-6-47 39l15-11 9 15 12-15 15 8 15-25m123-11q58-6 47 39l-15-11-9 15-12-15-15 8-15-25Z',ORANGE)+line('m99 221 20-6m68 4 20 5m-87-49 11-3',ORANGE,3)
        fy=164;anchor=(150,112,.99)
    elif slug=='nanari':
        art=p('M94 207 83 264h24l21-59m66 1 10 58h25l-5-70Z',YELLOW)+e(169,198,74,38,YELLOW)+r(85,112,54,94,YELLOW,23)
        art+=p('M97 87 75 35l31 17 17 34m5 0 19-46 19 12-25 43Z',YELLOW)+e(116,99,45,39,YELLOW)+e(112,115,29,20,PAPER)
        art+=''.join(flower(x,y,12,PAPER) for x,y in [(88,150),(111,159),(136,147),(163,174),(189,170),(215,178)])+p('M235 193q36-13 22-33l-27 15Z',YELLOW)
        fx=114;fy=97;anchor=(116,62,.55)
    elif slug=='ichiri':
        art=flower(227,196,25,PAPER)+p('M108 205q-21 24-51 26l-10 23q57 11 91-28m35-20q-11 22 1 51l44 10q9-18-19-27l9-35Z',RED)
        art+=leaf(121,108,45,GREEN,-13)+leaf(180,110,46,GREEN,15)+p('M115 156q-26 29-12 68 25 31 74 13 57-49 13-79Z',RED)+e(149,131,60,50,RED)
        art+=p('M112 170q-49 1-39 30l35 4m78-26q35 7 25 32l-33-10Z',RED)+''.join(p(f'M{x} {y}l3-5 4 5-4 6Z',YELLOW,'none') for x,y in [(107,122),(191,120),(124,187),(157,216),(187,193)])
        fy=132;anchor=(149,84,.73)
    elif slug=='soramame':
        art=p('M34 216q-20-53 16-63 36-2 34 50 74-22 169 9l30 32q-137 44-245 2Z',YELLOW)
        art+=p('M88 198q-17-112 74-118 116-11 109 129-92 39-183-11Z',GREEN)+''.join(c(x,y,23,YELLOW) for x,y in [(117,175),(157,139),(202,139),(242,175)])
        art+=line('M50 165 29 120m38 46 13-56',INK,5)+c(29,120,7,GREEN)+c(80,110,7,GREEN)+line('M204 97V45',INK,4)+leaf(204,72,18,GREEN,70)
        fx=55;fy=217;anchor=(55,163,.39)
    elif slug=='himari':
        art=''.join(group(p('M-16-56q-28-37 12-65 32 28 13 68Z',YELLOW),f'translate(141 142) rotate({i*30})') for i in range(12))
        art+=c(141,140,70,ORANGE)+''.join(line(f'M{x} {y}l6 9',INK,3) for x,y in [(110,97),(138,85),(165,99),(89,127),(119,127),(153,125),(181,129)])
        art+=p('M83 183q15-53 68-22 38 10 65 37 57 9 36 40-46 39-123 18-58-14-46-73Z',PAPER)+c(247,220,9,INK)
        art+=foot(101,264,GREEN)+foot(178,266,GREEN)+foot(217,256,GREEN)+foot(76,248,GREEN)
        fx=185;fy=213;anchor=(180,175,.66)
    elif slug=='kurune':
        art=p('M184 247 239 251l-8-20 39-6-15-22 22-21-25-16 10-29-27-3-9-34-23 18-31-25-1 31-33-2 10 31-18 17 22 16-14 26 26 7-1 23Z',GREEN)
        art+=line('M190 229q56-66 21-103',ORANGE,9)+p('M101 181q-37 29-24 66 45 33 101 7 6-60-39-70Z',ORANGE)+p('M71 122 67 57l40 28m42 0 38-30-3 67Z',ORANGE)
        art+=p('M69 140q-7-45 44-57l15-19 19 19q47 12 46 55l-37 45h-56Z',ORANGE)+p('M72 134q51-22 118 0l-35 45h-53Z',PAPER)
        art+=p('M97 189q-28 36 11 50l24-19m28-32q29 36-3 51l-24-18Z',ORANGE)+e(135,218,23,28,PAPER)+foot(101)+foot(171)
        fx=129;fy=133;anchor=(128,85,.75)
    elif slug=='shiipo':
        art=p('M98 200v63h27l13-63m66-1 10 65h28v-80Z',PAPER)+e(171,198,88,45,PAPER)
        art+=p('M45 129q28-75 131-66 84 13 93 81-118 41-224-15Z',RED)+p('M84 154q86-37 179-5l-7 20-168 4Z',YELLOW)
        art+=e(99,183,55,45,PAPER)+p('M52 183q-36 5-27 49 6 38 39 10-28 5-17-22l20-4Z',PAPER)
        art+=''.join(e(x,y,15,9,PAPER) for x,y in [(101,109),(158,88),(216,118)])+line('M103 159l7 14m43-12v14m43-13-6 14m35-14-7 13',INK,3)
        fx=96;fy=185;anchor=(96,141,.64)
    elif slug=='waramo':
        art=p('M119 218q-99 44-96-21 0-45 47-39 35 12 17 44-23 16-36-4 25 8 23-10-12-21-30-3-14 27 26 35l38-21Z',GREEN)
        art+=p('M94 203q22-63 120-47l29 34q-71 70-149 44Z',GREEN)+p('M181 160q-11-64 47-60 56 10 38 67l-33 32Z',GREEN)
        art+=''.join(p(f'M{x} {y}l3-31 14 12 10-26 14 17-10 33Z',YELLOW) for x,y in [(109,176),(139,156),(169,153)])
        art+=line('M120 222l-11 37h-21m96-46 13 45h22',GREEN,13)+e(211,135,22,25,PAPER)+e(253,137,16,22,PAPER)+c(213,135,6,INK)+c(254,136,6,INK)+line('M220 165q22 10 35-3')
        return e(150,276,106,6,INK,'none',opacity='.12')+art,(228,100,.64)
    elif slug=='donguri':
        art=p('M88 213v54h26l10-46m83-4 9 50h27v-63Z',ORANGE)+e(167,190,94,57,ORANGE)+p('M90 126 55 104l12 49m52-26 29-32 9 44Z',ORANGE)
        art+=p('M38 178q0-52 65-52 54 5 52 70-20 44-82 36Z',ORANGE)+p('M34 144q0-75 72-69 60-3 62 67-53 21-134 2Z',GREEN)+line('M104 78q-11-34 15-36',INK,8)
        art+=e(67,200,33,24,PINK)+e(58,200,3,7,INK)+e(75,200,3,7,INK)+p('M100 223q-15-24-4-38l13 24m19 12q25-18 16-34l-18 20Z',PAPER)+line('M172 143v39m25-37v39m24-31v32',YELLOW,7)
        fx=97;fy=171;anchor=(101,84,.78)
    elif slug=='kuruwu':
        art=p('M111 161Q51 79 17 108l23 31-18 15 26 27-9 17 40 32 33-28m75-41q60-82 94-53l-23 31 18 15-26 27 9 17-40 32-33-28Z',ORANGE)
        art+=line('M37 126l67 54m-58-23 53 41m-36-3 32 19m168-88-67 54m58-23-53 41m36-3-32 19',PAPER,4)
        art+=p('M102 106 91 48l44 28m32 0 42-29-5 65Z',ORANGE)+p('M92 112q58-54 119 0v101q-11 49-62 44-60-9-57-55Z',ORANGE)+face(150,135,'owl')+line('M121 201l13 11 17-12 17 12 14-12m-46 38-8 29m38-29 8 29',INK,4)
        return e(150,276,83,6,INK,'none',opacity='.12')+art,(150,79,.79)
    elif slug=='takenon':
        art=foot(109,265,INK)+foot(197,265,INK)+p('M104 151Q65 168 69 222l22 19 27-42m67-48q52 10 52 66l-22 21-31-40Z',INK)+p('M98 177q51-28 103 0l13 59q-55 43-124 0Z',GREEN)
        art+=c(93,112,21,INK)+c(206,112,21,INK)+e(150,134,74,51,PAPER)+e(117,132,18,25,INK)+e(184,132,18,25,INK)+e(151,220,42,32,PAPER)
        art+=p('M91 99 150 63l60 36-61 13Zm11-31 48-32 49 32-49 11Zm20-29 28-26 28 26-28 7Z',GREEN)+leaf(93,190,27,YELLOW,-48)+leaf(209,190,27,YELLOW,48)
        fx=150;fy=136;anchor=(150,89,.87)
    elif slug=='wakarun':
        art=p('M198 219q83-20 76 8-18 28-76 24Z',GREEN)+p('M78 196q55-34 113-8 77 38 18 69-87 35-152-20Z',GREEN)
        art+=c(61,137,16,GREEN)+c(147,130,17,GREEN)+e(105,163,56,49,GREEN)+e(99,184,34,23,PAPER)
        art+=p('M65 207l23-17 20 12 17-14 26 12 16-6 13 24-23 17-21-12-27 9-19-9-23 7Z',TEAL)+p('M130 220q14-54 45-16 24-14 29 19l-20 31h-41Z',PAPER)+line('M172 210v36m-24-30 14 31m28-28-12 27',RED,3)
        art+=p('M105 217q-4 31 45 29l3-15m41-13q30 12 9 30l-20-13Z',GREEN)
        fx=104;fy=163;anchor=(105,116,.67)
    elif slug=='hotape':
        art=p('M103 217Q11 185 31 118l22 6-4-26 29 9 7-31 35 15 28-38 32 35 34-17 14 34 28-8-1 29 23-4q25 81-81 95Z',PAPER)
        art+=line('M150 207 43 125m110 79L83 102m73 102-7-128m9 129 48-107m-48 113 94-81',RED,4)
        art+=p('M129 153q42-5 62 34l32 33 47 14-17 17-55-5q-37 26-81-7l-34-13-38 5 6-23 45-18Z',PAPER)+e(148,164,51,42,PAPER)+p('M118 198 68 253l35 12 46-50m26-16 33 61 34-11-34-45Z',RED)
        fx=149;fy=161;anchor=(149,124,.61)
    elif slug=='shiochi':
        art=p('M103 146 69 173v24h13v20h20l18-56m70-15 42 27v24h-13v20h-20l-20-56Z',BLUE)+p('M102 108q0-45 49-46 49 0 49 46v106l-24 47h-51l-23-47Z',BLUE)+p('M119 136q32-30 64 0v98q-29 23-64 0Z',PAPER)
        art+=p('M118 72V44l16-13 13 14v24m4 0V28l15-11 14 13v41m4 1V47l14-9 11 10v34Z',TEAL)+e(151,114,33,31,PAPER)+p('M142 126h18l-9 13Z',YELLOW)+foot(122,267)+foot(181,267)+line('M83 180h17m103 0h18',PAPER,3)
        fy=111;anchor=(151,64,.59)
    elif slug=='konburuu':
        art=p('M82 230q71 55 136-7 18-24 27-54 9 59-32 87-75 46-135 1Z',GREEN)+p('M130 216q-65-21-52-80 6-26 34-26 59 20 31 61-20 15 3 35l-6 29Z',GREEN)
        art+=p('M81 121q-25-51 23-67l18 14 21-17 14 28q40 19 10 60-42 23-86-18Z',GREEN)+p('M126 143q-27 14-13 56 17 38 46 33l-6 23q-60-7-66-52-4-40 18-66Z',YELLOW)
        art+=''.join(p(f'M{x} {y}q54-34 29-91-2 38-31 43l-15 36Z',TEAL if i%2 else GREEN) for i,(x,y) in enumerate([(139,166),(176,208),(210,224),(225,202)]))
        art+=line('M101 161l24 6m-20 13 24 6m-18 11 26 5m-12 11 25 3',GREEN,3)+p('M86 170 44 189l13 19 36-20Z',GREEN)
        fx=123;fy=104;anchor=(123,68,.57)
    elif slug=='aosaya':
        art=line('M150 217q-18 60 28 65',GREEN,8)+leaf(178,278,19,GREEN,81)+leaf(181,278,17,TEAL,135)
        art+=p('M150 70Q115 117 38 141l-24 66 43-10 16 29 36-14 41 43 42-43 35 14 18-29 43 10-25-66Q188 117 150 70Z',TEAL)
        art+=p('M41 153 27 190l35-7 20 29 29-14 39 39 40-39 29 14 21-29 33 7-15-37-14 14-29 5-21 19-43-40-42 40-21-19-28-5Z',GREEN)+p('M102 166q45-44 94 0l-45 61Z',PAPER)+c(113,128,6,YELLOW)+c(187,128,6,YELLOW)
        fy=172;anchor=(150,92,.68)
    elif slug=='kohakani':
        art=''.join(line(f'M{x} 231l{dx} 16 {dx} 16',RED,9) for x,dx in [(92,-26),(106,-20),(119,-10),(184,10),(198,20),(211,26)])
        art+=p('M99 207q-21-49 0-100 20-40 68-62 54 39 52 90l-9 73Z',ORANGE)+line('M174 188q-70-7-42-68 24-35 51-6 25 35-8 38-20-5-8-22',PAPER,6)+e(153,222,62,34,RED)
        art+=line('M106 210 70 164m128 44 39-68',INK,10)+p('M68 173q-39-9-29-45l20 17 22-17q14 37-13 45Z',RED)+p('M235 149q-58-11-30-84l31 35 33-28q20 61-34 77Z',RED)+star(246,128,12,YELLOW)
        fx=151;fy=215;anchor=(151,193,.74)
    elif slug=='papriko':
        art=p('M113 220 93 266h30l21-43m30 0 8 44h28l-9-50Z',RED)+line('M202 212q79 10 67-69-6-35-36-15-15 19 7 27',GREEN,13)
        art+=p('M104 169q-27 54 13 71 36 21 70-1 35-23 12-70Z',RED)+p('M105 96 91 42l44 39m32 0 44-41-10 58Z',GREEN)+p('M89 114q-3-51 33-37 28-21 57 0 42-15 37 38l-11 50-110-1Z',RED)
        art+=p('M96 163l20-15 15 26 21-13 18 12 20-28 21 18-20 30-19-5-22 20-25-22-16 5Z',GREEN)+p('M103 199 63 185l-13 19 46 22m103-27 26-36 23 12-33 47Z',RED)+line('M123 202v28m59-29v29',INK,3)
        fy=119;anchor=(151,81,.72)
    elif slug=='renpuku':
        art=p('M152 207q64-52 96-17 55-22 29 47-24 37-103 10Z',TEAL)+line('M185 225l72-8m-47 7 26-28m-7 25 19 20',PAPER,3)
        art+=p('M91 188q77-17 125 34-23 49-122 19Z',PAPER)+p('M96 222 63 253l20 15 33-24m53-14 17 36 25-5-17-30Z',PAPER)
        for side in [-1,1]:
            for yy,rot in [(119,side*32),(148,0),(177,side*-32)]:art+=e(107+side*67,yy,29,11,PINK,INK,3,transform=f'rotate({rot} {107+side*67} {yy})')
        art+=e(108,155,65,49,PAPER)+''.join(e(x,y,5,8,INK,'none') for x,y in [(124,218),(146,231),(167,217),(188,233)])
        fx=108;fy=153;anchor=(108,107,.76)
    elif slug=='negin':
        art=p('M112 172q55-35 99 18 15 28 28 42-46 24-91-16Z',PAPER)+p('M193 223q81-4 70-79 30 84-46 109Z',PAPER)
        art+=p('M72 179 68 231l-24 29h27l32-38 11-31m56 22 3 45h28l-8-54Z',PAPER)+p('M72 99 47 32l19-10 35 70m-4 5 1-75 23-5 1 76m-1 9 33-60 20 10-30 62Z',GREEN)
        art+=p('M61 125q0-43 55-34 52 10 38 50l-27 46-49-10Z',PAPER)+e(106,162,31,23,YELLOW)+line('M242 183l20 12m-21 7 16 13m-27 5 13 15',GREEN,9)
        fx=107;fy=131;anchor=(108,95,.63)
    elif slug=='caroron':
        art=''.join(leaf(196,212,47,GREEN,angle) for angle in [29,56,81,107])+p('M103 205 89 264h25l23-55m57 0 10 55h27l-19-65Z',ORANGE)
        art+=p('M96 155q72-9 110 34l-19 40-77-8Z',ORANGE)+p('M64 107 48 30l48 46m12 9 31-56 9 62Z',ORANGE)+p('M53 137q2-62 68-46 62 4 33 58l-50 59-48-45Z',ORANGE)
        art+=p('M55 135l48 25 51-13-50 60-48-44Z',PAPER)+c(104,196,7,INK)+line('M167 175l13 22m-6-31 21 13',YELLOW,4)
        fx=103;fy=131;anchor=(104,93,.67)
    elif slug=='nasumii':
        art=p('M113 148 40 68 19 177l28-9 5 33 27-13 15 37 23-27m65-51 77-79 23 109-28-9-5 33-27-13-16 37-23-27Z',GREEN)
        art+=line('M106 157 47 88l3 87m143-18 59-69-3 87m-147-19-25 36m121-36 25 36',PAPER,3)
        art+=p('M126 103 105 54l34 26 18-25 29 25 16-26-4 52q27 71-2 135-43 43-83-2-24-74 13-136Z',PURPLE)+p('M114 106l10-30 30 20 22-25 23 39-41 13Z',GREEN)+e(155,209,27,40,PAPER)+p('M139 253l-14 18 23-3m19-15 15 18-23-3Z',PURPLE)
        fy=151;anchor=(155,111,.51)
    elif slug=='poncoro':
        art=line('M210 216q72 2 50-56-24-18-35 3 26-10 22 15-10 17-27 10',GREEN,20)+foot(108,264,GREEN)+foot(198,264,GREEN)
        art+=p('M104 149q-55 24-40 72 9 50 54 39 29 25 59 0 49 12 59-36 10-55-41-75Z',ORANGE)+line('M101 174q-13 53 18 83m36-88v88m46-79q13 43-18 78',INK,3)
        art+=c(104,80,20,GREEN)+c(197,80,20,GREEN)+e(151,122,68,50,ORANGE)+p('M92 112q25-24 57 13 36-37 63-12l-8 27-52-3-50 3Z',INK)+p('M140 76q-8-42 18-41l11 14q-18-1-11 28Z',GREEN)+p('M88 177 46 166l-5 28 44 12m125-29 44-14 7 26-46 19Z',ORANGE)
        fy=124;anchor=(151,76,.77)
    elif slug=='pururin':
        art=p('M101 199 87 268h21l21-66m69-6 6 72h22l-1-76Z',YELLOW)+p('M88 180q46-53 112-20 48 17 28 58-81 27-136-4Z',YELLOW)+r(90,97,44,102,YELLOW,16)
        art+=line('M99 87 84 39 62 27m23 16 21-24m12 64 22-47 19-10m-20 14-4-25',ORANGE,8)+p('M88 94 53 68q-13 22 35 45m38-15 31-25q13 20-28 41Z',YELLOW)+e(107,108,43,35,YELLOW)+p('M69 96q18-41 70-10l8 17-18 11-23-11-18 7Z',ORANGE)
        art+=''.join(c(x,y,6,PAPER,'none') for x,y in [(143,177),(169,168),(195,180),(157,203),(190,204)])+p('M226 177q35-13 22-31l-30 15Z',YELLOW)
        fx=107;fy=113;anchor=(107,84,.53)
    elif slug=='moffuru':
        art=p('M119 203 105 266h25l17-54m55-4 6 58h25l1-63Z',ORANGE)+r(104,149,126,76,YELLOW,25)+p('M218 162h54v55h-36v-20h17v-16h-35Z',ORANGE)
        art+=line('M134 157v60m29-60v59m29-58v58m-78-34h106m-105 22h105',ORANGE,6)+p('M70 101 60 42l42 33m30 0 41-34-5 65Z',ORANGE)+r(57,88,117,99,YELLOW,31)+p('M78 144q37-24 78 0l-14 31H92Z',PAPER)+c(115,151,6,INK)+p('M75 180h72l-17 22h-35Z',RED)
        fx=117;fy=124;anchor=(117,91,.66)
    elif slug=='panri':
        art=p('M180 214q81 13 102 43l-17 11-77-26Z',ORANGE)+line('M226 231l-5 19m28-7-9 15m25-3-8 9',PAPER,4)+p('M97 224 84 267h25l17-39m63-4 16 43h25l-16-49Z',PAPER)
        art+=p('M68 202Q42 77 157 65q113 6 92 140l-63 42-97-1Z',ORANGE)+p('M64 191q-40-33-44 13l15 40 65-11 12-27Z',PAPER)
        art+=line('M110 82q-39 78-11 151m36-161q-23 100 5 168m21-166q22 84 3 163m23-156q38 75 17 145m11-126q25 47 14 107',PAPER,6)
        fx=64;fy=212;anchor=(65,184,.47)
    elif slug=='monaro':
        art=c(93,90,23,RED)+c(211,90,23,RED)+p('M75 140q-19-44 34-53 15-40 49-14 41-29 56 15 52 0 28 50 48 31 11 69 15 49-41 46-36 37-60 1-49 38-73-10-51 7-39-43-28-32 5-61Z',PAPER)
        art+=line('M101 105q-35 2-17 34m37-42q18-22 35 0m25 0q28-14 37 16m10 76q25 18 0 34m-114-25q-25 17-2 36',ORANGE,4)+foot(103,268,RED)+foot(200,268,RED)
        art+=p('M93 178q-29 30 5 55l32-27m72-28q34 25 3 55l-33-25Z',RED)+e(153,228,41,25,ORANGE)+line('M122 220h64m-68 13h70m-49-28v42m22-42v42',PAPER,3)
        fy=149;anchor=(153,92,.93)
    elif slug=='mintotto':
        for side in [-1,1]:
            art+=group(p('M0 0Q-45-129-118-108l9 22-16 17 12 22-12 21 18 11-4 22 35 21 55-8Z',GREEN)+line('M-10-7-98-91m56 52-31 3m14-27-2-26m5 81-33-8',PAPER,3),f'translate(150 164) scale({side} 1)')
            art+=group(p('M0 0q-76-8-95 77l28-6 16 30 21-20 26 14 16-51Z',TEAL)+line('M-7 10-64 80m33-40-28 6',PAPER,3),f'translate(150 171) scale({side} 1)')
        art+=e(150,203,21,60,YELLOW)+e(150,142,32,32,PAPER)+line('M135 117Q105 47 76 72m88 44q32-69 60-43',INK,4)+line('M134 190h32m-29 21h27m-22 20h19',INK,3)
        fy=145;anchor=(150,114,.45)
    elif slug=='cacaoro':
        art=p('M190 218q65 34 83-68-52-37-83 18Z',ORANGE)+line('M212 223q30-32 39-65',PAPER,5)+p('M97 200 74 261h27l26-52m72-4 1 60h26l-1-64Z',ORANGE)
        art+=p('M88 172q24-52 89-30 64 23 43 80-91 36-132-20Z',ORANGE)+line('M132 150q-15 39 8 74m22-75q-9 47 10 76m15-65q15 26 8 57',INK,3)
        art+=p('M73 104q27-26 61 7 28 30-7 64l-42-12-53 50-15-15 46-59Z',PAPER)+e(99,105,13,19,ORANGE)+p('M110 195q-46 20-18 55l14-16 13 3 4-24m75-8q34 15 13 44l-12-15-13 3Z',BLUE)
        fx=100;fy=135;anchor=(104,106,.52)
    elif slug=='tsukimo':
        art=p('M177 250q114-4 89-119-14-49-62-47 39 23 16 50-35 4-21 41 33 23-9 36Z',PURPLE)+line('M231 103q42 88-14 117',YELLOW,6)
        art+=p('M76 174q-28 57 5 80 54 30 120-5-11-74-70-86Z',PURPLE)+c(79,107,28,PURPLE)+c(176,99,29,PURPLE)+c(79,107,13,YELLOW)+c(176,99,14,YELLOW)+e(125,145,69,52,PURPLE)
        art+=p('M155 199q-39 8-15 40-61 15-63-21 7-37 78-19Z',YELLOW)+foot(93,267,PURPLE)+foot(177,267,PURPLE)+star(209,160,10,YELLOW)
        fx=124;fy=145;anchor=(125,96,.80)
    elif slug=='mitsuru':
        art=p('M212 165 281 97l-6 128-57-25Z',TEAL)+p('M102 107 127 52l24 42 34-20 5 47m-59 110-7 48 32-24 24 13 5-41Z',BLUE)
        art+=p('M43 172q-4-74 99-69 93 5 87 76-8 67-104 68-77-7-82-75Z',INK)+e(133,210,46,21,RED)+line('M115 112q-44-57 5-67m46 58q9-58 47-44',YELLOW,5)+c(125,44,21,YELLOW)+c(220,61,15,YELLOW)+c(124,43,8,PAPER)+c(220,60,5,PAPER)
        art+=line('M236 167l33-45m-32 56 27 22m-26-30 31-5',PAPER,3)+p('M70 195 39 214l18 20 30-17Z',TEAL)
        fx=127;fy=170;anchor=(132,107,.87)
    elif slug=='ankoro':
        art=p('M109 114 35 44 48 134 20 197l72 27 54 48 58-48 76-27-29-63 13-90-75 70Z',PAPER)+line('M43 63l68 104M34 191l79 9m141-137-66 104m78 23-79 10',RED,4)
        art+=p('M177 228q67 4 59 30-19 22-52 3-32 15-34-14Z',RED)+e(151,188,49,63,RED)+c(104,87,21,RED)+c(200,87,21,RED)+e(151,131,69,52,RED)+e(151,151,43,28,PAPER)+c(145,107,6,PAPER,'none')
        art+=p('M108 176 55 98l-13 9 43 88m111-17 48-81 13 8-39 92Z',RED)+foot(113,247,RED)+foot(190,247,RED)
        fy=130;anchor=(151,81,.80)
    elif slug=='ramunon':
        art=''.join(line(f'M{x} 174q{(-1 if i%2 else 1)*25} 32 0 58t{(-1 if i%2 else 1)*11} 44',TEAL if i%2 else BLUE,8) for i,x in enumerate([83,110,137,164,191,218]))
        art+=p('M46 168q2-113 106-106 98 1 102 106l-25 23-24-17-25 17-28-17-27 18-26-18-26 16Z',BLUE)+r(130,37,44,34,TEAL,5)+e(152,37,28,9,PAPER)+c(174,18,7,PAPER)+c(196,31,4,PAPER)
        art+=c(86,127,10,PAPER)+c(112,95,6,PAPER)+c(210,131,8,PAPER)+line('M69 154q83 18 161 0',TEAL,4)
        fy=126;anchor=(151,71,.83)
    elif slug=='yorucha':
        art=''.join(p(d,GREEN) for d in ['M182 223Q272 211 264 85q-31 34-58 74Z','M177 228q115 24 105-74-40 11-72 44Z','M177 231q78 67 98 2-47-20-74-5Z'])
        art+=line('M206 206q30-52 47-92m-36 111 49-50m-52 69 41 3',PAPER,3)+p('M102 208 94 265h25l19-57m44 1 10 56h26l-9-67Z',GREEN)+p('M99 161q80-35 111 40-20 43-105 14Z',GREEN)
        art+=leaf(73,105,35,GREEN,-24)+leaf(135,97,37,GREEN,12)+p('M49 130q4-51 65-37 65 11 33 63l-38 39-44-26Z',GREEN)+p('M54 138l48 19 47-10-40 47-40-24Z',PAPER)+leaf(131,218,29,PAPER,32)
        fx=103;fy=132;anchor=(104,95,.64)
    elif slug=='suirenne':
        art=p('M133 216q54 50 94-9 11-26 43-19 25 61-46 78-68 16-108-25Z',TEAL)+line('M231 236l23-33m-15 21 24 8',PAPER,3)
        art+=p('M98 132q-39 79 30 111l29-23q-55-19-36-72Z',TEAL)+p('M100 178 57 195l10 25 32-17m52 24-8 37 27 3 14-33Z',TEAL)
        art+=''.join(group(p('M-17-35q-25-27 0-57 27 16 25 48Z',PINK),f'translate(114 133) rotate({angle})') for angle in range(0,360,45))
        art+=p('M70 114q-12-46 28-52 53-15 66 36 12 43-43 62-45-5-51-46Z',TEAL)+e(114,124,37,26,PAPER)+p('M106 153q-21 27 23 65l19-14q-31-30-21-48Z',PAPER)
        fx=115;fy=107;anchor=(114,65,.61)
    else:raise ValueError(slug)
    light=slug in {'nasumii','poncoro','tsukimo','mitsuru','ramunon','yorucha','takenon'}
    art+=face(fx,fy,light=light)
    return e(150,276,93,6,INK,'none',opacity='.12')+art,anchor


def make_characters():
    out=[]
    for n,row in enumerate(PROFILES):
        slug,name,b,a,shape,description,personality,categories,tags,progress,dialogue=row
        ident='c-'+slug
        stages=[]
        for stage in range(5):
            path=f'/expansion/assets/characters/{ident}-{stage}.svg'
            stage_name=STAGE_NAMES[stage]
            if stage==0: art,(hx,hy,hs)=seed_art(slug,b,a)
            elif stage in [1,2]: art,(hx,hy,hs)=young_art(slug,stage,b,a)
            elif stage==3: art=adult_art(slug,2,b,a);hx,hy,hs=HEAD_ANCHORS[n]
            else: art,(hx,hy,hs)=signature_art(slug,b,a)
            write_svg(path,svg(art,f'{name}・{stage_name}',ident=f'{ident}-{stage}'))
            anchor={'x':hx,'y':hy}
            transform={'translateX':round(hx-150*hs,2),'translateY':round(hy-76*hs,2),'scaleX':hs,'scaleY':hs}
            note=[SEED_NOTES[slug],*YOUNG_NOTES[slug],progress[2],SIGNATURE_NOTES[slug]][stage]
            stages.append({'name':stage_name,'description':note,'artPath':path,
                           'renderSpec':{'headAnchor':anchor,'hatTransform':transform}})
        out.append({'id':ident,'name':name,'description':description,'personality':personality,
                    'habitat':COLLECTIONS[n//6],'favoriteCategories':categories.split(),
                    'favoriteTags':tags.split(),'discovery':{'adultCompanions':1+n//5,'uniqueRecipes':3+(n*77//35)},
                    'dialogue':dict(zip(['greeting','fed','newDish','repeatDish'],dialogue)),
                    'stages':stages,'palette':{'body':b,'accent':a,'outline':INK},'silhouette':shape,
                    'renderSpec':{'viewBox':'0 0 300 300','groundY':276,'adultHeadAnchor':stages[3]['renderSpec']['headAnchor'],'style':'food-field-guide-ink-v1'}})
    return out


def write_svg(path,text):
    target=ROOT/'public'/path.lstrip('/')
    target.parent.mkdir(parents=True,exist_ok=True)
    ET.fromstring(text)
    target.write_text(text,encoding='utf-8')


# All headwear uses the original pet's 300-square overlay coordinates. Each
# item has its own functional outline, rather than a shared hat recolored.
HATS = [
('picnic-straw','ピクニックの麦わら','平たいつばに赤いリボン。畑へおべんとうを運ぶ日には、この赤が草むらを歩くもぐの目印になる。','meadow'),
('wildflower-crown','野の花のかんむり','白い花と黄いろい花を交互に編んだ、小さな輪。畑の帰り道に子どもが作り、食事の前にはかまどの棚へそっと置く。','meadow'),
('ladybird-cap','てんとう虫キャップ','丸い羽の継ぎ目まで描いた、赤いてんとう虫の帽子。','meadow'),
('butterfly-ribbon','ちょうちょのリボン','葉脈みたいな線が入った、左右に広がるちょうちょ結び。','meadow'),
('watering-hat','じょうろのぼうし','長い注ぎ口と取っ手が楽しい、空っぽの小さなじょうろ。','meadow'),
('carrot-ribbon','にんじんリボン','葉付きにんじんを留め具にした、菜園のヘアバンド。','meadow'),
('mushroom-cap','きのこ帽','赤い傘に白い斑点。つばの下にはきのこのひだ。','forest'),
('trail-ranger','森の案内帽','曲げたつばと山形の折り目がある、森の案内役の帽子。','forest'),
('acorn-hood','どんぐりフード','網目の殻帽と短い軸をつけた、木の実の頭巾。','forest'),
('pinecone-crown','まつぼっくり冠','重なるうろこを立体的に並べた、木の実のかんむり。','forest'),
('woodpecker-feather','きつつきの羽根帽','一枚の赤い羽根を差した、細いつばのフェルト帽。','forest'),
('forest-lantern','探検ランタン','明かりの形をした飾りを正面につけた、探検用ヘアバンド。','forest'),
('sailor-knot','水兵さんの帽子','青い帯と錨のワッペンがついた水兵帽。ニカの港では、荷運びを手伝うもぐに、船乗りの古い服から小さな帽子を仕立てる。','seaside'),
('shell-tiara','貝がらティアラ','扇形の貝と小さな真珠を並べた、海辺の冠。','seaside'),
('fish-vane','おさかな風見帽','横向きの魚がちょこんと乗る、港の風見帽子。','seaside'),
('lifebuoy-halo','うきわのヘアリング','赤白の区切りがくっきりした、軽い飾りの浮き輪。','seaside'),
('coral-branches','さんごの枝飾り','枝分かれしたさんごに、小さな青い貝を留めた。','seaside'),
('paper-sailboat','折り紙ヨット','山折りの線が見える、青い紙で作った小さな船。','seaside'),
('vendor-tenugui','食堂のねじりはちまき','白と紺の布をねじって結んだ、町の食堂のはちまき。','market'),
('fishmonger-bandana','魚屋の三角巾','波の模様と大きな結び目がある、藍色の三角巾。','market'),
('produce-basket','八百屋のかご帽','トマトと葉野菜を描いた、小さな籐かごの帽子。','market'),
('radish-earmuffs','だいこん耳あて','白い根っこと緑の葉で耳を包む、野菜の耳あて。','market'),
('rice-measure','升のぼうし','木組みの角と稲穂の紋を入れた、空っぽの一合升。','market'),
('paper-bag-hat','買いもの紙袋帽','折った口と持ち手が目印。買いもの帰りの遊び心。','market'),
('baker-kerchief','パン職人のスカーフ','小麦の印をつけた、きゅっと結んだ赤いスカーフ。','cafe'),
('pancake-stack','パンケーキ帽','三段のパンケーキと四角いバターを模した帽子。','cafe'),
('coffee-cup','コーヒーカップ帽','大きな取っ手と湯気の飾りをつけた、陶器風の帽子。','cafe'),
('toast-crown','トースト王冠','こんがりした食パンの山が三つ並ぶ、朝ごはんの冠。','cafe'),
('parfait-ribbon','パフェのリボン','アイスといちごを小さく飾った、喫茶店のリボン。','cafe'),
('teapot-bonnet','ティーポットのボンネット','注ぎ口と丸いふたが左右に飛び出す、お茶会の帽子。','cafe'),
('moon-wizard','三日月のとんがり帽','折れた先に三日月がぶら下がる、夜空色の帽子。ヨルバの夕方の食卓では、揺れる月を幼いもぐが目で追っている。','night'),
('constellation-cap','星図キャップ','三つの星を線で結んだ、天体観測のキャップ。','night'),
('cloud-nightcap','雲のナイトキャップ','長いしっぽの先に雲をつけた、しま模様の寝帽子。','night'),
('paper-lantern','提灯のかぶりもの','骨組みの線と赤い房をつけた、小さな提灯の帽子。','night'),
('comet-bow','流れ星の髪飾り','二本の長い尾と一つの星でできた、流れ星の髪飾り。','night'),
('clockwork-visor','時計台のサンバイザー','小さな文字盤と歯車を並べた、時計台の見張り帽。','night'),
]


def hat_art(slug):
    if slug=='picnic-straw':
        return e(150,72,72,13,YELLOW)+p('M107 70l10-42q32-19 64 0l13 42Z',YELLOW)+p('M110 55h80l4 13h-87Z',RED)+p('M182 59l26-13-1 31-25-10Z',RED)+line('M91 73h19m13-40 55 0m-58 9h63m-66 5h69m12 26h13',INK,2)
    if slug=='wildflower-crown':
        return line('M88 75q62-47 125 0',GREEN,9)+''.join(flower(x,y,11,PAPER if i%2 else YELLOW) for i,(x,y) in enumerate([(92,68),(117,53),(145,45),(173,50),(201,66)]))+leaf(85,71,10,GREEN,-40)+leaf(215,73,10,GREEN,40)
    if slug=='ladybird-cap':
        return p('M88 75q0-63 63-63 64 2 64 63Z',RED)+line('M151 15v60',INK,4)+c(121,34,8,INK)+c(101,59,7,INK)+c(137,58,7,INK)+c(179,35,8,INK)+c(197,60,7,INK)+p('M128 76q22-25 45 0Z',INK)+line('M142 22l-9-16m28 16 11-16',INK,4)
    if slug=='butterfly-ribbon':
        return p('M145 57Q84-15 81 31q-8 24 20 28-32 16-15 32l59-21m9-13q62-72 65-26 8 24-20 28 32 16 15 32l-59-21Z',BLUE)+e(151,60,12,19,YELLOW)+line('M92 31l41 24m-30 21 30-11m76-34-40 24m30 21-30-11',PAPER,3)
    if slug=='watering-hat':
        return p('M113 35h65l10 43h-82Z',TEAL)+p('M177 42q45-26 43 14-9 22-32 5l-3-11q19 10 23 1 0-16-26 3Z',TEAL)+p('M111 61 78 41l-8 8 35 29Z',TEAL)+e(76,43,10,5,YELLOW)+r(123,24,44,12,YELLOW,4)+flower(145,58,11,PAPER)
    if slug=='carrot-ribbon':
        return line('M83 77q65-34 133 0',GREEN,12)+group(p('M-18-17Q-2-27 16-14L6 40Z',ORANGE)+line('M-13-7H1m-8 16H6',INK,2)+leaf(-6,-18,12,GREEN,-27)+leaf(5,-18,11,GREEN,20), 'translate(155 43) rotate(-18)')+p('M99 67 79 51l3 34 24-12m93-6 20-16-3 34-24-12Z',RED)
    if slug=='mushroom-cap':
        return p('M79 64q2-48 71-51 67 1 74 51-67 23-145 0Z',RED)+p('M92 65q54 15 116 0l-6 16H99Z',PAPER)+line('M111 70v8m19-5v7m21-6v7m22-8v6m21-11v7',INK,2)+e(109,43,11,7,PAPER)+e(156,29,15,8,PAPER)+e(196,48,10,7,PAPER)
    if slug=='trail-ranger':
        return e(150,74,73,12,GREEN)+p('M108 69l8-43 32-13 35 10 12 46Z',GREEN)+p('M110 56h83v12h-85Z',ORANGE)+p('M117 27l34 15 30-18', 'none',INK,3)+star(150,60,10,YELLOW)+line('M82 75h17m104 0h14',PAPER,2)
    if slug=='acorn-hood':
        return p('M90 71q-2-53 59-54 62-1 63 54l-17 11h-89Z',ORANGE)+p('M88 56q58-35 127 0v18q-65 13-127 0Z',GREEN)+line('M101 54l19 22m2-26 25 28m5-29 24 28m4-26 22 24m-4-19-24 20m-4-27-25 29m-4-27-26 24',PAPER,2)+line('M150 17q-4-18 17-12',INK,6)
    if slug=='pinecone-crown':
        art=''
        for y,count in [(70,5),(52,4),(34,3),(18,2)]:
            for j in range(count):
                x=150+(j-(count-1)/2)*23;art+=p(f'M{x-17} {y-13}Q{x} {y-27} {x+17} {y-13}L{x} {y+10}Z',ORANGE if j%2 else YELLOW)
        return art+line('M98 78q52 8 104 0',GREEN,7)
    if slug=='woodpecker-feather':
        return e(150,77,72,10,BLUE)+p('M107 72l11-44 29 12 35-14 12 46Z',BLUE)+p('M112 55h78l3 14h-84Z',RED)+p('M179 56q-15-38 13-48 24 25-13 48Z',RED)+line('M177 66l15-43',PAPER,2)
    if slug=='forest-lantern':
        return line('M86 77q63-32 130 0',GREEN,13)+r(128,28,43,51,YELLOW,9)+r(133,35,33,31,PAPER,5)+p('M124 29h52l-6-10h-40Z',RED)+line('M141 19V9h17v10',INK,4)+line('M139 66 150 43l11 23',RED,3)+r(134,73,30,8,RED,2)
    if slug=='sailor-knot':
        return p('M96 65q-24-33 3-37 54-26 108 0 24 10-4 37Z',PAPER)+p('M98 58q51 15 103 0l-5 24h-93Z',BLUE)+line('M150 64v13m-13-7q13 20 26 0m-18-5h10',PAPER,3)+c(150,63,3,PAPER,'none')+p('M194 73l20 5-7 13-16-15Z',BLUE)
    if slug=='shell-tiara':
        return line('M88 78q61-23 125 0',BLUE,8)+p('M129 70 109 34q4-17 19-9 8-25 23-13 21-10 26 10 23-9 22 13l-26 35Z',PAPER)+line('M150 65V18m-7 47-17-36m32 36 18-38',RED,3)+c(106,66,7,PAPER)+c(191,65,7,PAPER)+c(151,76,9,YELLOW)
    if slug=='fish-vane':
        return e(150,78,64,10,YELLOW)+p('M111 73q-1-29 38-30 36 0 40 30Z',BLUE)+line('M151 49V17',INK,4)+p('M151 20q-30-25-51 0 20 26 51 0l24-19v37Z',RED)+c(111,17,3,PAPER,'none')+line('M129 10v20',INK,2)+p('M189 58l19 13-23 2Z',BLUE)
    if slug=='lifebuoy-halo':
        return e(150,58,71,28,PAPER)+e(150,57,46,12,TEAL)+p('M80 51l29 1 1 13-28-1m127-13 10 0v15l-10-1M132 31l1 15h28V31m-29 38v16h27V69Z',RED)+line('M86 73q64 30 126 0',INK,2)
    if slug=='coral-branches':
        return line('M98 76q53-13 105 0',BLUE,8)+line('M115 76 109 35l-16-14m17 21 22-17m18 49V26l-12-16m12 26 18-22m16 62 10-43 17-13m-21 27-18-12',RED,10)+c(111,38,3,YELLOW)+c(151,33,3,YELLOW)+c(192,41,3,YELLOW)+p('M131 79q18-29 38 0Z',TEAL)+line('M140 74l8-9m7 10 4-9',PAPER,2)
    if slug=='paper-sailboat':
        return p('M80 57h139l-23 25h-88Z',BLUE)+p('M149 9v51H94Z',PAPER)+p('M157 17v43h49Z',RED)+line('M94 66h108m-82 0 26 15 26-15',PAPER,2)+line('M149 10v72',INK,3)
    if slug=='vendor-tenugui':
        return p('M88 62q63-19 121 0l-4 17q-60-19-113 0Z',PAPER)+line('M98 60l14 15m5-18 17 17m5-19 17 16m5-15 17 18m5-15 17 17',BLUE,7)+p('M190 59l28-24 4 20-17 13 15 16-22 7-17-23Z',PAPER)+line('M205 53l10-8m-11 33 7 7',BLUE,4)
    if slug=='fishmonger-bandana':
        return p('M93 74 141 18q11-10 23 3l44 53Z',BLUE)+line('M96 73q57-14 113 0',PAPER,5)+line('M122 53q10-12 20 0t20 0 20 0m-47-16q8-9 16 0t16 0',PAPER,3)+p('M201 68l19-25 6 31-17 5 9 11-25-9Z',BLUE)
    if slug=='produce-basket':
        return c(128,36,20,RED)+leaf(121,20,9,GREEN,-30)+leaf(164,58,21,GREEN,-15)+leaf(180,58,26,GREEN,25)+p('M93 42h115l-12 40h-92Z',YELLOW)+line('M107 48l7 28m13-28 3 29m15-29v29m18-29-3 29m20-29-6 28M99 58h102M102 71h96',INK,2)+line('M111 40q39-56 77 0',INK,5)
    if slug=='radish-earmuffs':
        return line('M89 68q1-48 60-48 61 0 63 48',BLUE,9)+p('M77 51q12-10 23 1l-10 35Z',PAPER)+p('M201 51q13-10 25 1l-13 35Z',PAPER)+leaf(84,51,12,GREEN,-25)+leaf(94,51,11,GREEN,15)+leaf(207,51,12,GREEN,-15)+leaf(218,51,11,GREEN,25)+line('M81 63h11m114 0h11',INK,2)
    if slug=='rice-measure':
        return p('M100 31 157 18l49 17-56 15Z',YELLOW)+p('M100 31v45l50 10V50Z',ORANGE)+p('M150 50v36l56-13V35Z',YELLOW)+line('M100 43l12 3v11l-12-2m0 9 12 3v12m94-32-12 3v11l12-3m0 10-12 3',INK,3)+line('M174 74V51',GREEN,3)+leaf(174,65,6,GREEN,-50)+leaf(174,58,6,GREEN,50)
    if slug=='paper-bag-hat':
        return p('M111 22h79l-5 61h-70Z',YELLOW)+p('M111 22 127 13h70l-7 9Z',ORANGE)+line('M129 30q-1-30 25-25 18 5 15 25',INK,5)+p('M127 48h46v25h-46Z',RED)+p('M135 65l14-13 15 13Z',PAPER)+line('M119 77h61',INK,2)
    if slug=='baker-kerchief':
        return p('M87 72q14-39 62-42 47 1 65 42Z',RED)+p('M187 64l27-24 4 25-13 8 15 15-28-5-12-14Z',RED)+line('M97 69q42-18 88 0',PAPER,4)+line('M145 65V39',YELLOW,3)+leaf(145,61,6,YELLOW,-48)+leaf(145,52,6,YELLOW,48)
    if slug=='pancake-stack':
        return e(150,76,63,10,PAPER)+r(101,55,98,18,ORANGE,9)+e(150,55,49,10,YELLOW)+r(105,39,90,18,ORANGE,9)+e(150,39,45,10,YELLOW)+r(110,23,80,18,ORANGE,9)+e(150,23,40,10,YELLOW)+p('M138 19q16-9 24 2l2 36q-8 14-14 0l-3-27-13-3Z',RED)+p('M137 15l16-8 17 7-15 9Z',PAPER)
    if slug=='coffee-cup':
        return e(148,81,53,7,BLUE)+p('M111 32h72l-6 38q-25 15-58 0Z',PAPER)+p('M183 38q38-8 22 25l-27 6 2-10q26 3 21-13l-19 3Z',BLUE)+e(147,33,36,8,INK)+line('M133 21q-12-9 0-17m25 17q-12-9 0-17',RED,4)+star(147,57,12,YELLOW)
    if slug=='toast-crown':
        return p('M93 73V42q-19-29 10-29 16 0 15 20 0-31 26-29 25 0 22 31 5-27 28-22 25 5 8 32v30Z',ORANGE)+p('M106 65V42q-13-15-5-17 8-1 8 16l25 1q-10-24 9-24 16 2 9 24l26-1q3-19 13-15 6 6-7 20v19Z',PAPER)+line('M98 76h99',RED,7)
    if slug=='parfait-ribbon':
        return p('M143 65q-40-37-60-13l12 33 48-12m14-8q40-37 60-13l-12 33-48-12Z',BLUE)+c(150,63,17,PAPER)+p('M126 57q-8-22 11-23-1-22 20-18 19-3 15 22 20 2 5 24Z',PAPER)+p('M159 37q-20-14-6-24 15-9 20 7Z',RED)+leaf(164,12,8,GREEN,70)+line('M96 55l29 14m78-14-27 14',PAPER,3)
    if slug=='teapot-bonnet':
        return e(150,61,46,26,TEAL)+p('M110 49 85 34l-7 10 28 29Z',TEAL)+p('M192 43q39-13 30 20-8 19-26 8l-1-8q23 9 19-11l-19 4Z',TEAL)+e(150,38,27,7,PAPER)+c(150,28,7,RED)+flower(152,60,11,YELLOW)+line('M115 82h69',INK,4)
    if slug=='moon-wizard':
        return e(150,79,71,9,BLUE)+p('M108 76 142 17l42-10-18 25 28 44Z',BLUE)+p('M169 14q-19 5-9 22-22-2-16-19 5-10 25-3Z',YELLOW)+star(145,55,11,PAPER)+star(175,64,7,YELLOW)
    if slug=='constellation-cap':
        return p('M90 72q5-51 57-54 57 0 59 54Z',BLUE)+p('M158 71q58-13 65 7l-61 9Z',BLUE)+line('M115 55l25-17 29 23 17-23',PAPER,2)+star(115,55,6,YELLOW)+star(140,38,7,YELLOW)+star(168,61,7,YELLOW)+c(186,38,4,PAPER,INK,1.5)
    if slug=='cloud-nightcap':
        return p('M95 72q12-59 72-59 36 0 44 41l-21 10q-11-18-26-22l21 30Z',BLUE)+p('M92 66q41-13 95 0l-2 17H95Z',PAPER)+line('M115 36l49 9m-38-22 55 7',PAPER,5)+p('M187 58q-2-19 13-15 10-12 18 4 15-1 11 13-10 10-21 5-16 7-21-7Z',PAPER)
    if slug=='paper-lantern':
        return r(114,24,75,49,RED,23)+r(122,17,59,10,INK,3)+r(123,71,58,10,INK,3)+line('M122 35h59m-65 13h72m-64 13h56m-40-36q-13 23 0 47m26-47q13 23 0 47',PAPER,2)+line('M151 81v8m-5-6v6m11-6v6',RED,3)
    if slug=='comet-bow':
        return p('M180 47Q124 9 82 20l36 29-30 20q46 7 96-5Z',BLUE)+p('M166 46 100 27l34 23-35 9 70 2Z',PAPER)+star(187,54,31,YELLOW)+line('M92 79h24m10 0h14',RED,3)
    if slug=='clockwork-visor':
        return p('M89 66q60-31 116 0l-9 18-111-5Z',GREEN)+e(174,81,51,7,YELLOW)+c(145,46,25,PAPER)+c(145,46,3,RED)+line('M145 46V28m0 18 13 9m-13-30v4m0 34v4m-21-21h4m34 0h4',INK,3)+c(190,52,13,ORANGE)+line('M190 33v6m0 26v6m-19-19h6m26 0h6m-32-13 5 5m18 17 5 5',INK,4)
    raise ValueError(slug)


ROOMS = [
('picnic-hill','見晴らしのピクニック丘','黄色い日よけと野花の道。丘の上に敷いた大きなクロス。','meadow'),
('herb-greenhouse','ハーブの温室','青い骨組みのガラス屋根と、名前札の付いたハーブ棚。','meadow'),
('rapeseed-terrace','菜の花テラス','花畑を見渡す木のデッキ。白い柵と赤いベンチが目印。','meadow'),
('harvest-barn','収穫の納屋','むき出しの梁と、かぼちゃや麦をしまう収穫用の納屋。','meadow'),
('orchard-porch','果樹園の軒先','赤い実の枝が窓に届く、果実箱の並んだ軒先。','meadow'),
('sunflower-house','ひまわりの小屋','大きなひまわりの窓と、黄いろい道具棚の小屋。','meadow'),
('mushroom-cabin','きのこの丸い家','丸窓、曲がった柱、赤いきのこ屋根の小さな家。','forest'),
('fern-conservatory','シダの観察室','吊り鉢と葉のスケッチを並べた、森の観察室。','forest'),
('chestnut-reading','栗の実の読書室','格子の本棚と栗の形の座布団がある、静かな読書室。','forest'),
('bamboo-pavilion','竹林の茶屋','竹の柱と低い茶箪笥を置いた、風の通る茶屋。','forest'),
('log-kitchen','丸太の台所','積んだ丸太の壁と赤いかまど。薪のにおいが似合う台所。','forest'),
('acorn-lookout','どんぐり見晴らし台','高いアーチ窓から木々を見渡す、小さな見晴らし台。','forest'),
('tidepool-veranda','潮だまりの縁側','浅い潮だまりに面した縁側。貝の標本箱を端に置いた。','seaside'),
('lighthouse-nook','灯台守の休憩室','厚い丸窓と赤白の壁。灯台の内側にある休憩室。','seaside'),
('dock-galley','波止場のまかない室','船の丸窓、吊り鍋、ロープの結び目があるまかない室。','seaside'),
('shell-atelier','貝がらのアトリエ','扇形の窓と、貝がらを仕分ける青い作業机。','seaside'),
('seaglass-window','海ガラスの窓辺','海の色のガラスをはめた窓と、瓶が並ぶ飾り棚。','seaside'),
('sail-loft','帆布の屋根裏','三角の帆布を天井に張り、船旅の地図を飾った屋根裏。','seaside'),
('morning-vegetables','朝市の八百屋','しま模様の日よけの下に、野菜かごと木箱を並べた店先。','market'),
('rice-store','お米屋さんの奥座敷','稲穂の暖簾と米袋のある、お米屋さんの小さな座敷。','market'),
('spice-arcade','スパイス通り','連続するアーチと瓶棚。香辛料の色が楽しい通り。','market'),
('covered-alley','商店街の休憩所','高いアーケードとベンチ。買い物袋を置いてひと休み。','market'),
('festival-stall','縁日の屋台','赤い提灯と青いのれん。祭りの準備が整った屋台。','market'),
('fishmonger-kitchen','魚屋の台所','波柄のタイルと魚の看板。青い流し台がある台所。','market'),
('town-kissaten','町の喫茶店','赤いベンチシートと丸い照明。いつもの席がある喫茶店。','cafe'),
('corner-bakery','街角のパン屋','アーチ形のオーブンとパン棚。木の床の小さなパン屋。','cafe'),
('waffle-workshop','ワッフル工房','格子の床と丸い鉄板。できあがりを待つための工房。','cafe'),
('tea-salon','葉っぱのティールーム','大きな茶缶と急須の棚。深緑の壁のティールーム。','cafe'),
('coffee-roastery','コーヒー焙煎室','大きな焙煎釜と豆袋、横長の窓がある焙煎室。','cafe'),
('dessert-kiosk','おやつの売店','パフェの看板とガラスケースがある、赤い屋根の売店。','cafe'),
('rooftop-supper','屋上の晩ごはん','街の明かりを見下ろす屋上。頭上に旗と電球を渡した。','night'),
('observatory-room','星見の食堂','丸い天井と望遠鏡。星を見ながら休める小さな食堂。','night'),
('rain-window','雨音の窓辺','大きな窓に雨筋が流れる、青い夜のくつろぎ部屋。','night'),
('lantern-court','提灯の中庭','赤い提灯と白い石畳。町の裏手の小さな中庭。','night'),
('midnight-library','深夜の図書室','背の高い本棚と緑の卓上灯。夜更かしのための図書室。','night'),
('moon-greenhouse','月明かりの温室','月を映すガラス屋根と、水辺の花を育てる温室。','night'),
]


def window(x,y,w,h,kind='square',night=False):
    sky=BLUE if night else TEAL
    radius=w/2 if kind=='round' else (w/2 if kind=='arch' else 7)
    out=r(x,y,w,h,PAPER,radius,INK,6)+r(x+9,y+9,w-18,h-18,sky,max(0,radius-9),INK,2)
    out+=c(x+w*.73,y+h*.29,14,YELLOW,INK,2)
    if kind=='round':out+=line(f'M{x+10} {y+h/2}h{w-20}M{x+w/2} {y+10}v{h-20}',PAPER,5)
    else:out+=line(f'M{x+w/2} {y+9}v{h-18}M{x+9} {y+h*.63}h{w-18}',PAPER,5)
    if night:out+=star(x+w*.29,y+h*.25,5,PAPER)+c(x+w*.43,y+h*.39,2,PAPER,'none')
    else:out+=p(f'M{x+13} {y+h*.75}q{w*.22} {-h*.18} {w*.43} 0t{w*.43} 0v{h*.17}H{x+13}Z',GREEN,'none')
    return out


def pot(x,y,kind='leaf',color=RED,scale=1):
    out=p('M-25 0h50l-6 36h-38Z',color)+r(-29,-6,58,10,PAPER,3)
    if kind=='flower':out+=line('M0-4v-60m0 35-19-12',GREEN,4)+flower(0,-64,15,YELLOW)+leaf(0,-25,13,GREEN,65)
    elif kind=='fern':
        out+=line('M0-5q-14-41 5-70',GREEN,4)
        for k in range(4):out+=leaf(-3,-15-k*14,10,GREEN,-65)+leaf(-3,-18-k*14,10,GREEN,65)
    elif kind=='bamboo':out+=line('M-9-7v-77M12-6v-95',GREEN,9)+line('M-15-29h12m-12-27h12M6-37h12M6-65h12',PAPER,2)+leaf(11,-69,15,GREEN,55)
    else:out+=leaf(0,-4,28,GREEN,-25)+leaf(0,-4,24,GREEN,37)+leaf(0,-8,33,GREEN,0)
    return group(out,f'translate({x} {y}) scale({scale})')


def shelf(x,y,w=170,kind='jars',color=RED):
    out=r(x,y,w,130,PAPER,6)+line(f'M{x} {y+64}h{w}M{x+6} {y+131}h{w-12}',INK,5)
    for row in range(2):
        for j in range(4):
            xx=x+13+j*(w-23)/4; yy=y+10+row*65
            if kind=='books':out+=r(xx,yy,18+(j%2)*7,46,[BLUE,RED,YELLOW,GREEN][j],2)+line(f'M{xx+4} {yy+10}h10M{xx+4} {yy+33}h10',PAPER,2)
            elif kind=='bread':out+=p(f'M{xx} {yy+45}q-9-37 13-37 26-3 22 37Z',YELLOW)+line(f'M{xx+7} {yy+14}l11 10m-15 1 11 10',INK,2)
            else:out+=r(xx,yy+9,25,36,[RED,GREEN,YELLOW,BLUE][(j+row)%4],4)+r(xx-1,yy+5,27,7,INK,1)+r(xx+5,yy+22,15,9,PAPER,1,INK,1)
    return out+r(x-7,y+128,w+14,9,color,2)


def cabinet(x,y,w=185,color=BLUE,kind='plain'):
    out=r(x,y,w,115,color,4)+r(x-7,y-11,w+14,16,PAPER,4)+line(f'M{x+w/2} {y+8}v100',INK,4)+c(x+w/2-12,y+50,4,YELLOW)+c(x+w/2+12,y+50,4,YELLOW)
    if kind=='sink':out+=e(x+w*.5,y-9,w*.28,8,INK)+line(f'M{x+w*.62} {y-11}v-28q0-19-15-19v12',INK,5)
    if kind=='stove':out+=e(x+w*.5,y-10,42,9,INK)+p(f'M{x+w*.3} {y-46}h{w*.4}v29q-{w*.2} 12-{w*.4} 0Z',RED)+e(x+w*.5,y-47,w*.2,5,PAPER)
    return out


def crate(x,y,w=160,kind='vegetable'):
    out=r(x,y,w,70,ORANGE,3)+line(f'M{x} {y+22}h{w}M{x} {y+46}h{w}M{x+13} {y}v70M{x+w-13} {y}v70',INK,3)
    if kind=='vegetable':out+=c(x+35,y-13,22,RED)+leaf(x+34,y-31,9,GREEN,25)+leaf(x+91,y+3,30,GREEN,-15)+p(f'M{x+111} {y-35}q22-7 27 7l-22 41Z',ORANGE)
    elif kind=='apple':out+=''.join(c(x+28+j*37,y-13,21,RED)+leaf(x+26+j*37,y-30,8,GREEN,20) for j in range(3))
    elif kind=='pumpkin':out+=e(x+54,y-18,34,27,ORANGE)+line(f'M{x+50} {y-43}v-13M{x+42} {y-40}q-14 21 0 47M{x+65} {y-40}q14 21 0 47',GREEN,3)
    return out


def lamp(x,y,kind='pendant'):
    if kind=='lantern':return line(f'M{x} 0v{y-35}',INK,3)+r(x-28,y-35,56,65,RED,24)+r(x-18,y-42,36,9,INK,2)+r(x-18,y+28,36,9,INK,2)+line(f'M{x-25} {y-17}h50M{x-28} {y}h56M{x-25} {y+16}h50',PAPER,2)
    return line(f'M{x} 0v{y-30}',INK,4)+p(f'M{x-38} {y}l18-31h40l18 31Z',YELLOW)+e(x,y,38,7,PAPER)


def room_art(slug):
    idx=next(i for i,v in enumerate(ROOMS) if v[0]==slug)
    collection=COLLECTIONS[idx//6];night=collection=='night'
    wall=[PAPER,PAPER,PAPER,PAPER,PAPER,BLUE][idx//6]
    floor=[YELLOW,GREEN,TEAL,ORANGE,ORANGE,INK][idx//6]
    content=r(0,0,800,600,wall,0,'none')+r(0,375,800,225,floor,0,'none')+line('M0 375H800',INK,6)
    # Bold but low contrast flooring preserves a readable pet stage.
    content+=line('M0 450H800M0 535H800M160 375 70 600M640 375l90 225',PAPER if night else INK,2)
    content+=e(400,501,157,56,PAPER,INK,3)
    if slug=='picnic-hill':
        content=r(0,0,800,385,PAPER,0,'none')+p('M0 280q120-95 244-14 200-73 350 0 123-88 206 19v315H0Z',GREEN)+p('M0 375q170-67 339 16 175-65 461-10v219H0Z',YELLOW)+r(233,409,336,137,PAPER,5)+line('M249 425h301M249 448h301M260 416v120M291 416v120M510 416v120M541 416v120',RED,4)
        content+=p('M16 120h200l-20 55H0Z',YELLOW)+line('M30 119v279m177-277v280',INK,7)+crate(29,438,155,'apple')+pot(727,452,'flower',BLUE,1.4)+c(581,76,38,RED)
    elif slug=='herb-greenhouse':
        content+=p('M0 85 400 0l400 85v80H0Z',TEAL)+line('M0 84h800M400 0v164M201 42v123M599 42v123',INK,8)+window(32,199,185,155)+shelf(580,214,175,'jars',GREEN)+pot(76,393,'leaf',RED)+pot(193,391,'fern',YELLOW)+pot(690,409,'leaf',RED,1.1)+lamp(401,118)
    elif slug=='rapeseed-terrace':
        content+=r(0,0,800,375,TEAL,0,'none')+p('M0 267q194-50 394 0 210-64 406 0v108H0Z',GREEN)+line('M0 327h800M0 368h800',PAPER,13)+''.join(line(f'M{x} 280v119',PAPER,11) for x in range(24,800,60))+r(34,416,180,46,RED,5)+line('M50 459v64m145-64v64',INK,7)+pot(686,421,'flower',RED,1.5)+''.join(flower(x,278,9,YELLOW) for x in [18,63,122,184,620,678,745])+c(612,90,43,YELLOW)
    elif slug=='harvest-barn':
        content+=p('M0 0h800v66L400 161 0 62Z',RED)+line('M39 28v348M760 26v350M43 93h716M44 94l354 62L758 92',INK,15)+window(57,151,144,158,'arch')+crate(590,376,169,'pumpkin')+crate(610,458,155,'apple')+pot(106,445,'leaf',GREEN)+line('M669 362v-132m-17 52 34 18m-34 12 34 14m-34 10 34 14',YELLOW,7)+lamp(400,210)
    elif slug=='orchard-porch':
        content+=r(0,0,800,91,RED)+line('M47 86v384M751 86v386',INK,10)+window(53,173,155,176,'arch')+window(589,173,159,176,'arch')+crate(49,423,163,'apple')+crate(604,433,153,'apple')+line('M42 125q40-65 162-53m548 51q-86-87-178-34',GREEN,16)+''.join(c(x,y,19,RED)+leaf(x,y-13,9,GREEN,30) for x,y in [(78,111),(153,78),(643,83),(713,105)])+lamp(400,135)
    elif slug=='sunflower-house':
        content+=r(0,0,800,69,YELLOW)+line('M0 72h800',INK,6)+flower(135,211,72,YELLOW)+c(135,211,40,BLUE)+line('M135 171v80m-40-40h80',PAPER,4)+shelf(580,202,173,'jars',YELLOW)+cabinet(572,403,195,YELLOW)+pot(102,453,'flower',RED)+r(47,296,178,33,RED,4)+lamp(401,119)
    elif slug=='mushroom-cabin':
        content+=p('M0 139Q140-54 400 1q231-45 400 138Z',RED)+''.join(e(x,y,35,15,PAPER) for x,y in [(98,99),(253,40),(601,60),(735,104)])+p('M31 140q44 107 5 241h37q35-166-12-241Zm711 0q-40 115-7 241h40q-34-111-2-241Z',ORANGE)+window(85,190,136,136,'round')+window(593,188,131,131,'round')+cabinet(580,414,173,GREEN)+pot(117,452,'fern',RED)+lamp(400,213)
    elif slug=='fern-conservatory':
        content+=line('M0 38h800M41 0v380M759 0v380',GREEN,12)+window(54,181,159,162)+shelf(583,221,173,'books',GREEN)+pot(78,139,'fern',RED,.7)+pot(712,155,'fern',YELLOW,.9)+line('M78 0v81M712 0v81',INK,3)+r(275,55,246,103,PAPER,6)+leaf(338,141,34,GREEN,-25)+leaf(438,141,33,GREEN,28)+pot(101,439,'fern',RED,1.2)+pot(697,442,'fern',YELLOW,1.2)
    elif slug=='chestnut-reading':
        content+=shelf(25,166,196,'books',GREEN)+shelf(579,166,197,'books',GREEN)+r(293,58,208,109,YELLOW,4)+p('M324 139q0-55 74-55 72 4 73 55Z',ORANGE)+line('M312 57v109m168-109v109',INK,4)+r(45,408,169,83,RED,17)+r(59,379,139,47,RED,13)+pot(691,447,'leaf',YELLOW)+lamp(400,36)
    elif slug=='bamboo-pavilion':
        content+=r(0,0,800,70,GREEN)+line('M45 69v308M80 69v308M720 69v308M755 69v308',GREEN,15)+''.join(line(f'M27 {y}h72m601 0h75',INK,3) for y in [134,222,310])+window(115,137,117,188,'arch')+window(568,137,117,188,'arch')+cabinet(586,420,175,RED)+pot(126,438,'bamboo',YELLOW,1.2)+line('M253 100h294',INK,5)+p('M270 99v70h113v-70m20 0v70h112v-70',PAPER)+leaf(324,153,18,GREEN)+leaf(459,153,18,GREEN)
    elif slug=='log-kitchen':
        content+=''.join(r(0,y,800,43,ORANGE,20) for y in [0,45,90,135])+window(37,223,167,130)+cabinet(575,403,196,RED,'stove')+p('M614 360V208h120v152Z',RED)+r(632,254,84,68,INK,22)+p('M658 307q-19-18 4-37 0 18 13 17 12-30 20-3 9 22-18 28Z',YELLOW)+pot(114,455,'leaf',GREEN)+line('M639 210V130h69v79',INK,8)
    elif slug=='acorn-lookout':
        content+=p('M0 0h800v110Q400-48 0 110Z',GREEN)+window(40,139,183,217,'arch')+window(577,139,183,217,'arch')+line('M253 75h294',INK,8)+p('M359 84q39-26 83 0v59q-44 35-83-1Z',ORANGE)+p('M351 77q46-25 99 0v18h-99Z',GREEN)+cabinet(582,426,177,BLUE)+pot(105,437,'leaf',RED)+line('M614 396 696 310m-44 71 42 20',INK,8)
    elif slug=='tidepool-veranda':
        content+=r(0,0,800,374,TEAL,0,'none')+line('M0 155q70-20 140 0t140 0 140 0 140 0 140 0 140 0M0 209q70-20 140 0t140 0 140 0 140 0 140 0 140 0',PAPER,5)+line('M0 324h800M32 286v89M174 286v89M626 286v89M768 286v89',INK,8)+crate(32,441,180,'none')+e(84,427,20,11,PAPER)+star(150,427,20,RED)+pot(710,447,'leaf',BLUE)+p('M0 265q65-39 114 0 72-25 132 15l-11 47H0Z',PAPER)+p('M576 280q58-27 103 0 78-44 121-13v62H576Z',PAPER)
    elif slug=='lighthouse-nook':
        content+=r(0,0,800,100,RED)+r(0,218,800,82,RED)+window(55,133,165,165,'round')+window(580,133,165,165,'round')+cabinet(587,415,172,BLUE)+r(62,407,145,95,PAPER,14)+e(133,405,74,11,YELLOW)+line('M272 54h254',INK,5)+p('M353 52h96l-11 78h-73Z',YELLOW)+line('M378 60v62m44-62v62',INK,4)+pot(710,372,'leaf',RED,.7)
    elif slug=='dock-galley':
        content+=r(0,0,800,76,BLUE)+window(46,178,159,159,'round')+window(589,178,159,159,'round')+cabinet(36,416,182,BLUE,'sink')+cabinet(582,416,185,RED,'stove')+line('M265 84h270',INK,7)+line('M295 86v56m58-56v64m128-64v67',INK,4)+c(295,160,22,YELLOW)+r(328,148,51,29,RED,6)+p('M458 154h48v31h-48Z',PAPER)+line('M103 78q-80 29-43 69 36 28 55-5-14-31-33-6',ORANGE,8)
    elif slug=='shell-atelier':
        content+=p('M280 145 242 66q10-30 38-17 17-47 49-20 39-20 53 15 37-17 45 17 35-1 27 32l-43 52Z',TEAL)+line('M347 139V40m-20 99-44-78m83 78 53-73',PAPER,5)+shelf(580,206,175,'jars',BLUE)+cabinet(574,420,193,BLUE)+r(45,398,171,16,PAPER,4)+line('M59 414v94m138-94v94',INK,7)+''.join(e(x,382,20,12,PAPER)+line(f'M{x-13} 382h26',RED,2) for x in [75,128,183])+pot(119,296,'leaf',RED,.8)
    elif slug=='seaglass-window':
        content+=r(39,111,194,242,INK,8)+r(52,124,82,101,TEAL,5)+r(143,124,77,61,BLUE,5)+r(143,194,77,137,GREEN,5)+r(52,235,82,96,YELLOW,5)+line('M52 178l81-39M143 273l76-37',PAPER,3)+shelf(581,168,173,'jars',TEAL)+cabinet(580,411,179,TEAL)+pot(126,442,'leaf',BLUE)+lamp(399,102)+line('M268 133h264',INK,4)+''.join(c(x,131,11,col) for x,col in [(291,RED),(328,TEAL),(365,BLUE),(403,YELLOW),(440,TEAL),(477,RED),(514,BLUE)])
    elif slug=='sail-loft':
        content+=p('M0 0h400L68 143Z',PAPER)+p('M411 0h389l-78 173Z',PAPER)+line('M0 0 399 144 800 0M64 143 400 0 722 172',BLUE,7)+r(42,206,168,124,YELLOW,5)+line('M65 291q20-47 59-41t65-29',BLUE,5)+star(122,250,10,RED)+window(586,191,154,154,'round')+crate(32,424,181,'none')+cabinet(582,423,180,BLUE)+line('M700 405V300m-34 70q31 55 66 0m-45-20h28',INK,8)+c(700,308,10,PAPER)
    elif slug=='morning-vegetables':
        content+=r(0,0,800,75,RED)+''.join(p(f'M{x} 75h80l-10 61q-32 24-70 0Z',RED if x%160 else PAPER) for x in range(0,800,80))+line('M23 138v255M777 138v255',INK,8)+crate(35,396,181)+crate(584,396,180)+crate(41,476,170,'pumpkin')+crate(593,478,173,'apple')+r(63,200,126,103,GREEN,7)+p('M91 251q4-31 35-34 34 3 34 34-35 33-69 0Z',RED)+leaf(127,220,13,GREEN)
    elif slug=='rice-store':
        content+=r(0,0,800,54,INK)+''.join(r(194+i*137,56,126,114,BLUE,3)+leaf(258+i*137,144,21,YELLOW) for i in range(3))+window(49,179,151,153)+shelf(590,208,166,'jars',GREEN)+''.join(p(f'M{x} {y}q-19-46 14-52h56q35 0 17 52l10 45h-108Z',PAPER)+line(f'M{x+6} {y-48}h74M{x+15} {y+6}h54',RED,5) for x,y in [(44,433),(100,495),(619,449)])+line('M0 398h800M0 552h800M252 375v225M548 375v225',GREEN,4)
    elif slug=='spice-arcade':
        content+=p('M0 0h800v75H0Z',RED)+''.join(p(f'M{x} 75q100-66 200 0v39h-17q-82-110-166 0h-17Z',YELLOW) for x in [0,200,400,600])+shelf(26,202,196,'jars',RED)+shelf(579,202,196,'jars',RED)+cabinet(36,419,183,GREEN)+cabinet(582,419,183,BLUE)+lamp(400,161)+p('M280 78h240v21H280Z',PAPER)
    elif slug=='covered-alley':
        content+=p('M0 154 400 0l400 154Z',TEAL)+line('M0 154h800M400 0v150M198 78l96 76M600 77l-99 77',INK,7)+r(42,217,172,127,RED,3)+line('M42 238h172m-172 22h172m-172 22h172m-172 22h172m-172 22h172',INK,2)+r(579,216,175,126,BLUE,3)+r(43,432,180,31,YELLOW,4)+line('M61 463v59m142-59v59',INK,7)+pot(697,443,'leaf',RED,1.3)+r(99,390,59,43,PAPER,3)+line('M110 390v-18h36v18',INK,4)
    elif slug=='festival-stall':
        content+=r(0,39,800,67,RED)+p('M0 0h800v39H0Z',INK)+''.join(r(x,109,114,72,BLUE,3)+p(f'M{x+30} 158l27-24 29 24Z',PAPER) for x in [17,148,541,672])+lamp(288,153,'lantern')+lamp(510,153,'lantern')+cabinet(34,422,182,RED)+cabinet(584,422,181,RED)+line('M32 105v315m736-315v315',INK,9)+p('M76 395h94l-10-58h-74Z',BLUE)+line('M91 337v-39m14 39v-39m15 39v-39m14 39v-39m15 39v-39',ORANGE,6)
    elif slug=='fishmonger-kitchen':
        content+=r(0,179,800,195,PAPER,0,'none')+''.join(line(f'M0 {y}h800',BLUE,3) for y in [179,226,273,320,371])+''.join(line(f'M{x} 179v195',BLUE,3) for x in range(0,801,67))+r(247,49,305,93,BLUE,5)+p('M324 94q66-58 117 0-65 60-117 0l-48-36v72Z',PAPER)+c(420,88,6,INK)+cabinet(35,419,185,BLUE,'sink')+cabinet(579,420,187,BLUE)+p('M636 347q38-30 61 0-41 39-61 0l-28-16v38Z',TEAL)+window(45,56,164,103)
    elif slug=='town-kissaten':
        content+=r(0,0,800,119,GREEN)+window(41,155,181,181,'arch')+window(578,155,181,181,'arch')+r(34,428,191,79,RED,13)+r(33,382,192,70,RED,16)+r(575,428,191,79,RED,13)+r(575,382,192,70,RED,16)+lamp(293,142)+lamp(505,142)+r(346,39,107,58,PAPER,5)+c(400,66,18,YELLOW)+line('M392 66h16m-8-8v16',INK,3)
    elif slug=='corner-bakery':
        content+=r(0,0,800,64,RED)+shelf(32,201,185,'bread',GREEN)+p('M581 434V231q0-98 91-99 99 0 99 101v201Z',RED)+p('M606 322v-66q-1-78 66-78 72 0 72 78v66Z',INK)+e(652,288,30,12,YELLOW)+e(699,290,27,12,YELLOW)+line('M637 284l11 11m3-14 11 12m25-12 10 12',INK,2)+cabinet(35,429,184,GREEN)+r(598,363,151,51,PAPER,4)+line('M615 382h113',INK,5)+lamp(397,107)
    elif slug=='waffle-workshop':
        content+=r(0,0,800,117,YELLOW)+line('M0 37h800M0 77h800M81 0v118M166 0v118M250 0v118M550 0v118M633 0v118M716 0v118',INK,4)+window(43,187,174,155)+cabinet(575,430,192,RED)+c(669,353,56,INK)+c(669,353,46,YELLOW)+line('M635 326h68m-76 24h84m-78 22h71m-61-52v70m24-80v88m24-78v68',ORANGE,6)+cabinet(39,430,176,BLUE)+lamp(400,164)
    elif slug=='tea-salon':
        content+=r(0,0,800,375,GREEN,0,'none')+window(45,142,175,173,'arch')+shelf(582,145,175,'jars',RED)+cabinet(575,426,190,RED)+pot(117,447,'leaf',YELLOW,1.1)+r(274,48,252,111,PAPER,5)+leaf(344,137,38,GREEN,-25)+leaf(437,137,38,GREEN,25)+p('M641 396q-28-58 20-58 39-2 32 46-22 21-52 12Z',YELLOW)+p('M690 349q33-8 28 17-10 19-25 4Z',YELLOW)+line('M653 329h26',INK,7)
    elif slug=='coffee-roastery':
        content+=r(0,0,800,81,INK)+window(45,149,172,123)+window(579,142,173,122)+cabinet(568,442,208,BLUE)+c(672,361,68,RED)+c(672,361,48,INK)+c(672,361,24,ORANGE)+line('M672 292V185h46v-75',INK,15)+line('M672 361l43 16',PAPER,6)+p('M52 496q-18-66 15-80h97q41 16 23 80Z',PAPER)+e(115,456,18,25,INK)+line('M115 437q-18 19 0 40',PAPER,2)+lamp(394,112)
    elif slug=='dessert-kiosk':
        content+=p('M0 79 84 7h632l84 72Z',RED)+r(30,79,740,30,RED)+line('M46 108v287M754 108v287',INK,8)+cabinet(29,428,199,RED)+r(32,304,190,115,TEAL,6)+p('M36 305l187 107',PAPER,'none',3)+''.join(p(f'M{x-17} 392v-27h35v27Z',PAPER)+c(x,356,19,RED if x%2 else YELLOW) for x in [70,125,181])+cabinet(577,428,196,BLUE)+r(609,198,112,169,PAPER,12)+p('M633 254h65l-18 52h-28Z',TEAL)+c(650,245,20,YELLOW)+c(678,244,20,PINK)+line('M665 307v30m-23 0h46',INK,4)
    elif slug=='rooftop-supper':
        content+=r(0,0,800,375,BLUE,0,'none')+''.join(r(x,238-h,64,h+137,INK,2)+r(x+13,251-h,12,18,YELLOW,1,INK,1)+r(x+37,288-h,12,18,YELLOW,1,INK,1) for x,h in [(0,46),(72,115),(152,73),(583,95),(662,137),(735,66)])+line('M0 331h800M28 331v59m164-59v59m472-59v59m108-59v59',PAPER,7)+line('M0 61q397 74 800 0',INK,4)+''.join(c(x,84 if x in [150,650] else 115,11,YELLOW) for x in [150,300,500,650])+pot(107,445,'leaf',RED)+cabinet(588,429,174,RED)+star(563,88,12,PAPER)+c(702,59,22,YELLOW)
    elif slug=='observatory-room':
        content+=p('M0 214Q-4 0 400 0q398-1 400 214Z',INK)+p('M70 179Q116 39 400 39q269 0 330 140Z',BLUE)+line('M400 38v137M173 93l93 84m359-86-87 87',PAPER,5)+star(259,100,10,YELLOW)+star(533,119,12,YELLOW)+c(442,97,24,YELLOW)+line('M651 428v-87m0 73-48 104m49-106 49 108',PAPER,7)+group(r(-65,-21,126,42,PAPER,7)+r(46,-27,24,55,RED,4)+r(-81,-12,19,24,RED,3),'translate(651 315) rotate(-32)')+shelf(31,231,184,'books',RED)+lamp(100,141)
    elif slug=='rain-window':
        content+=window(41,77,180,249,'arch',True)+window(578,77,180,249,'arch',True)+''.join(line(f'M{x} {y}l-10 31',PAPER,3) for x,y in [(79,118),(116,166),(170,134),(199,204),(611,138),(667,114),(711,212),(639,257)])+r(29,427,201,81,RED,16)+r(29,378,201,65,RED,16)+cabinet(584,427,176,GREEN)+lamp(400,126)+r(283,38,238,58,PAPER,4)+p('M335 77q-9-28 16-28 14-19 30 0 33-8 34 26Z',TEAL)+line('M351 80l-4 12m25-12-4 12m25-12-4 12',BLUE,3)
    elif slug=='lantern-court':
        content+=r(0,214,800,161,PAPER,0,'none')+line('M0 214h800M0 264h800M0 315h800',INK,4)+''.join(line(f'M{x} 214v161',INK,3) for x in [0,115,230,571,686,800])+p('M0 200 53 159h170l20 42Zm566 0 22-41h169l43 41Z',INK)+lamp(154,135,'lantern')+lamp(400,166,'lantern')+lamp(648,135,'lantern')+pot(110,446,'bamboo',RED,1.3)+pot(696,446,'bamboo',RED,1.3)+r(288,434,224,32,PAPER,7)+line('M0 553h800',PAPER,4)
    elif slug=='midnight-library':
        content+=shelf(25,119,201,'books',GREEN)+shelf(25,257,201,'books',GREEN)+shelf(574,119,201,'books',GREEN)+shelf(574,257,201,'books',GREEN)+c(400,84,49,PAPER)+line('M400 49v35l23 17',INK,5)+cabinet(580,439,184,RED)+line('M669 425v-53m-29 53h58',PAPER,6)+p('M624 369l14-37h59l18 37Z',GREEN)+e(670,370,45,7,YELLOW)+r(53,428,166,89,RED,15)+p('M93 409l42-14 42 14v34l-42-12-42 12Z',PAPER)
    elif slug=='moon-greenhouse':
        content+=p('M0 148 400 0l400 148Z',BLUE)+line('M0 148h800M400 0v149M198 75l83 74m322-75-82 75',PAPER,7)+window(38,190,184,152,'arch',True)+window(578,190,184,152,'arch',True)+p('M482 49q-49 48 2 87-71 11-70-44 4-42 68-43Z',YELLOW)+pot(108,444,'leaf',RED,1.15)+pot(695,444,'leaf',RED,1.15)+flower(108,345,31,PINK)+flower(695,345,31,PINK)+line('M23 147v228M776 147v228',PAPER,8)+lamp(306,129)
    else: raise ValueError(slug)
    return content


def make_items():
    out=[]
    for kind,entries in [('hat',HATS),('room',ROOMS)]:
        for n,(slug,name,description,collection) in enumerate(entries):
            ident='i-'+slug
            rare=['common','common','rare','rare','special','special'][n%6]
            gems=n%6==5
            path=f'/expansion/assets/items/{ident}.svg'
            view='0 0 300 300' if kind=='hat' else '0 0 800 600'
            render={'viewBox':view,'anchor':'head' if kind=='hat' else 'background','style':'food-field-guide-ink-v1'}
            if kind=='hat':render.update({'headAnchor':{'x':150,'y':76},'previewCrop':{'x':65,'y':0,'width':170,'height':100},'transparent':True,'layer':'above-companion'})
            else:render.update({'petSafeArea':{'x':255,'y':215,'width':290,'height':345},'petGroundY':515,'objectFit':'cover','layer':'behind-companion'})
            write_svg(path,svg(hat_art(slug) if kind=='hat' else room_art(slug),name,view,ident))
            out.append({'id':ident,'name':name,'description':description,'kind':kind,'currency':'gems' if gems else 'coins',
                        'price':(12+n//6*3+(8 if kind=='room' else 0)) if gems else (80+(n%6)*55+(n//6)*35)*(2 if kind=='room' else 1),
                        'rarity':rare,'collection':collection,'unlock':{'uniqueRecipes':(n//6)*10+(n%6)*3},'artPath':path,'renderSpec':render})
    return out


def main():
    characters=make_characters()
    only_characters='--characters-only' in sys.argv
    items=json.loads((ROOT/'content/expansion/items.json').read_text()) if only_characters else make_items()
    assert len(characters)==36 and len(items)==72
    assert len({v['id'] for v in characters+items})==108
    assert len({v['name'] for v in characters+items})==108
    assert sum(i['kind']=='hat' for i in items)==36
    assert sum(i['kind']=='room' for i in items)==36
    base=ROOT/'content'/'expansion'
    base.mkdir(parents=True,exist_ok=True)
    outputs=[('characters.json',characters)] if only_characters else [('characters.json',characters),('items.json',items)]
    for filename,data in outputs:
        (base/filename).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    paths=[s['artPath'] for v in characters for s in v['stages']]+[i['artPath'] for i in items]
    assert len(paths)==252 and len(set(paths))==252
    for path in paths:
        doc=ET.parse(ROOT/'public'/path.lstrip('/'))
        assert doc.getroot().tag=='{http://www.w3.org/2000/svg}svg'
    print('Generated and parsed: 36 species / 180 growth illustrations / 36 hats / 36 rooms; 252 SVGs.')


if __name__=='__main__':
    main()
