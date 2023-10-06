var fylker = ee.FeatureCollection('users/zandersamuel/NINA/Vector/Norway_administrative_fylker_2022');
var viken = fylker.filter(ee.Filter.eq('navn','Viken'));
Map.addLayer(viken, {color:'white'}, 'viken', 0)

var aoi = viken;

var kommunerNames = ['Sarpsborg', 'Fredrikstad', 'Asker', 'Bærum', 'Hole', 'Hemsedal', 'Gol', 'Hol']

var kommuner = ee.FeatureCollection('users/zandersamuel/NINA/Vector/Norway_administrative_kommuner_2022')
kommuner = kommuner.filter(ee.Filter.inList('navn', kommunerNames)).geometry()
Map.addLayer(kommuner, {}, 'kommuner',0)

var CLASS_NAMES = [
    'water', 'trees', 'grass', 'flooded_vegetation', 'crops',
    'shrub_and_scrub', 'built', 'bare', 'snow_and_ice'];

var lcDict = {
  labels: [
    "Build area", //1
    "Crops", //2
    "Bare ground", //3
    "Grass", //4
    "Shrub & scrub", //5
    "Trees", //6
    "Flooded vegetation", //7
    "Water", //8
    "Snow & ice" //9
    ],
  colors: [
    '#C4281B',
    '#E49635',
    '#A59B8F',
    '#88B053',
    '#DFC35A',
    '#397D49',
    '#f2bac1', // '#7A87C6'
    '#0002f6', // '#419BDF'
    '#6fdbde' // #B39FE1'
  ]
}
var lcVizParams = {
  min: 1,
  max: 9,
  palette: lcDict['colors']
};



var dw = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
  .filterBounds(aoi)
  .filter(ee.Filter.calendarRange(2015,2022,'year'))
  .filter(ee.Filter.calendarRange(5,9,'month'))
  // Exclude "dark features" anomaly images
  .filter(ee.Filter.neq('system:index', '20150812T104021_20160413T153307_T32VNM'))
  .filter(ee.Filter.neq('system:index', '20150911T104036_20161016T081626_T32VNM'))
  // Exclude scenes with cloud contamination after cloud mask
  .filter(ee.Filter.neq('system:index', '20160915T104022_20160915T161534_T32VNM'))
  .filter(ee.Filter.neq('system:index', '20160908T105022_20160908T105025_T32VNM'))
  .filter(ee.Filter.neq('system:index', '20210810T104031_20210810T104220_T32VNM'))
  .filter(ee.Filter.neq('system:index', '20210711T104031_20210711T104217_T32VNM'))
  .select(CLASS_NAMES);
//dw = dailyMosaics(dw).sort('system:time_start', true); 
Map.addLayer(dw.filter(ee.Filter.calendarRange(2015,2017,'year')), {}, 'dw raw',0)
print(dw.size())
var proj = dw.first().projection();
print(proj, 'projection')
print(proj.nominalScale(), 'projection scale (m)')

var lc2017 = dw
  .filter(ee.Filter.calendarRange(2017,2017,'year'))
  .reduce(ee.Reducer.median())
  .rename(CLASS_NAMES);
var lc2017Cat = probToCat_9cat(lc2017)
Map.addLayer(lc2017Cat, lcVizParams, 'lc2017 dw',0);

// Baseline and end -----
var lc2016 = dw
  .filter(ee.Filter.calendarRange(2016,2016,'year'))
  .reduce(ee.Reducer.median())
  .rename(CLASS_NAMES);
var lc2016Cat = probToCat_9cat(lc2016)
  // fill in ice and snow with 2017 data
lc2016Cat = lc2016Cat.where(lc2016Cat.eq(9), lc2017Cat)
Map.addLayer(lc2016Cat, lcVizParams, 'lc2016Cat dw',0);

var lc2022 = dw
  .filter(ee.Filter.calendarRange(2022,2022,'year'))
  .reduce(ee.Reducer.median())
  .rename(CLASS_NAMES);
var lc2022Cat = probToCat_9cat(lc2022)
Map.addLayer(lc2022Cat, lcVizParams, 'lc2022Cat dw',0);

// Change image -----
var dwAnnual = [];   
for (var i = 2016; i <= 2022; i++) { 
  var tmp_probs = dw.select(CLASS_NAMES).filter(ee.Filter.calendarRange(i,i, 'year')).median(); 
  dwAnnual = dwAnnual.concat(tmp_probs.set('system:time_start', (new Date(i,8,1)).valueOf())); 
}
dwAnnual = ee.ImageCollection(dwAnnual); 

var lcBaseline = probToCat_2cat(changeTypology_2cat(dwAnnual.median()));
Map.addLayer(lcBaseline, {min:0, max:1, palette:['a3c74d','d0c8bd']}, 'lcBaseline',0)

var trendGrey = getTrend(dwAnnual.map(changeTypology).select('grey'));
Map.addLayer(trendGrey, {min:-0.1, max:0.1, palette:['17ede3','000000','ff80f7']}, 'trends 2016 to 2022',0);

Map.addLayer(trendGrey.gt(0.05).selfMask().clip(aoi), {palette:['ff80f7']}, 'nedbygging trend 2016 to 2022',0)
Map.addLayer(trendGrey.lt(-0.05).selfMask().clip(aoi), {palette:['17ede3']}, 'gjengroing trend 2016 to 2022',0)

var changeMap = ee.Image(1).where(lcBaseline.eq(1), 4)
  .where(lcBaseline.eq(0), 1)
  .where(trendGrey.gt(0.05).selfMask(), 2)
  .where(trendGrey.lt(-0.05).selfMask(), 3)
Map.addLayer(changeMap.clip(aoi), {min:1, max:4, palette:['b6bb5c','ff80f7','17ede3','d0c8bd']}, 'changeMap',0)

// Exports ---------------------------
Export.image.toAsset({
  image: lc2022Cat.clip(viken),
  scale:10,
  description: 'viken_9cat_2022',
  assetId: 'projects/nina/GIS_synergy/Extent/Viken/viken_9cat_2022',
  region: aoi,
  maxPixels: 1e11
})
Export.image.toAsset({
  image: lc2016Cat.clip(viken),
  scale:10,
  description: 'viken_9cat_2016',
  assetId: 'projects/nina/GIS_synergy/Extent/Viken/viken_9cat_2016',
  region: aoi,
  maxPixels: 1e11
})
Export.image.toAsset({
  image: changeMap.clip(viken),
  scale:10,
  description: 'viken_change_dw_trendBased_2016_2022',
  assetId: 'projects/nina/GIS_synergy/Extent/Viken/viken_change_dw_trendBased_2016_2022',
  region: aoi,
  maxPixels: 1e11
})


///// Functions ---------------------------------------------------------------------------
function getTrend(collection) {
  var start = ee.Date(ee.Image(collection.first()).get('system:time_start')).get('year')
  collection = collection.map(function(img){
     var year = ee.Date(img.get('system:time_start')).get('year').subtract(ee.Number(start))
    return ee.Image(year).byte().addBands(img).set('system:time_start', img.get('system:time_start'))
  });
  var trend = collection.reduce(ee.Reducer.linearFit()).select('scale');
  return trend
}
function probToCat_9cat(img){
  var imgMax = img.reduce(ee.Reducer.max());
  var imgCat = ee.Image(0)
    .where(img.select('built').eq(imgMax), 1)
    .where(img.select('crops').eq(imgMax), 2)
    .where(img.select('bare').eq(imgMax), 3)
    .where(img.select('grass').eq(imgMax), 4)
    .where(img.select('shrub_and_scrub').eq(imgMax), 5)
    .where(img.select('trees').eq(imgMax), 6)
    .where(img.select('flooded_vegetation').eq(imgMax), 7)
    .where(img.select('water').eq(imgMax), 8)
    .where(img.select('snow_and_ice').eq(imgMax), 9)
  imgCat = imgCat.selfMask()
  return imgCat
}
function probToCat_2cat(img){
  var imgMax = img.reduce(ee.Reducer.max());
  var imgCat = ee.Image(0)
    .where(img.select('grey').eq(imgMax), 1);
  return imgCat
}
function changeTypology_2cat(img){
    var grey = ee.Image(img.select('built').add(img.select('bare'))).rename('grey');
    var other = ee.Image(1).subtract(grey).rename('other');
    return grey.addBands(other)
}
function changeTypology(img){
    var grey = ee.Image(img.select('built').add(img.select('bare'))).rename('grey');
    var tree = ee.Image(img.select('trees').add(img.select('shrub_and_scrub'))).rename('tree');
    var grass = ee.Image(img.select('grass').add(img.select('flooded_vegetation')).add(img.select('crops'))).rename('grass');
    var other = ee.Image(img.select('water').add(img.select('snow_and_ice'))).rename('other')
    return grey.addBands(tree).addBands(grass).addBands(other).copyProperties(img, img.propertyNames())
}


