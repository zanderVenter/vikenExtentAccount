var geometry = /* color: #d63000 */ee.Geometry.MultiPolygon(
        [[[[8.238775865990545, 61.078614562248106],
           [8.217489855248358, 61.024441182423665],
           [8.260748522240545, 60.98616496018867],
           [8.288214342553045, 60.972507494857],
           [8.456501575909726, 60.934037587630414],
           [8.528599354230039, 60.902665295445466],
           [8.679007171532511, 60.876573586244106],
           [8.716657657761514, 60.914070466225716],
           [8.636106811091352, 60.98360931295703],
           [8.401274047419477, 61.06039441111216],
           [8.329862914606977, 61.08497204751243],
           [8.291410766169477, 61.09393481419019]]],
         [[[8.113019261961218, 60.821373934301626],
           [8.079373632078406, 60.803961520850585],
           [8.179623876219031, 60.76374286010738],
           [8.252408300047156, 60.75267387652377],
           [8.313519750242468, 60.75602851734618],
           [8.311116490965125, 60.78938808899414],
           [8.277814183836218, 60.80278919118797],
           [8.219792638426062, 60.81300376408915],
           [8.163831029539343, 60.81518021897127]]],
         [[[7.799687747615032, 60.90622015876132],
           [7.820973758357219, 60.87749398783465],
           [8.17528284038847, 60.85409311945854],
           [8.267979983943157, 60.85409311945854],
           [8.265233401911907, 60.87983313167029],
           [8.21922815288847, 60.899208015543245],
           [8.037267093318157, 60.90488463131802],
           [7.916417483943157, 60.93025008822325],
           [7.844319705622844, 60.93025008822325]]],
         [[[8.194634100748072, 60.98241518751795],
           [8.17643799479104, 60.960424524897135],
           [8.18845429117776, 60.941920602471136],
           [8.22415985758401, 60.94558890149419]]],
         [[[8.087914754889058, 60.56995757754596],
           [8.017876913092183, 60.59626332416056],
           [7.916253377935933, 60.62726309239004],
           [7.816689779303121, 60.63803864109237],
           [7.745278646490621, 60.6430884399209],
           [7.582543661139058, 60.67135269561135],
           [7.525552083990621, 60.661934032790505],
           [7.605202962896871, 60.599971385802895],
           [7.671807577154683, 60.59525196071079],
           [7.794717123053121, 60.591880520426294],
           [7.949212362310933, 60.555446530928926],
           [8.001054098150776, 60.54768213474002],
           [8.067315389654683, 60.553927556576134]]],
         [[[7.6482265553305195, 60.74394938207345],
           [7.657152946932082, 60.71541301283331],
           [7.718951042635207, 60.726159092826336],
           [7.729937370760207, 60.746633852560436]]]]);


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

var kommunerNames = ['Sarpsborg', 'Fredrikstad', 'Asker', 'Bærum', 'Hole', 'Hemsedal', 'Gol', 'Hol']

var kommuneDict = {
  'Sarpsborg': {
    'startYear': 2017,
    'endYear': 2022
  },
  'Fredrikstad': {
    'startYear': 2017,
    'endYear': 2022
  },
  'Asker': {
    'startYear': 2016,
    'endYear': 2022
  },
  'Bærum': {
    'startYear': 2016,
    'endYear': 2022
  },
  'Hole': {
    'startYear': 2016,
    'endYear': 2022
  },
  'Hemsedal': {
    'startYear': 2016,
    'endYear': 2020
  },
  'Gol': {
    'startYear': 2016,
    'endYear': 2020
  },
  'Hol': {
    'startYear': 2015,
    'endYear': 2020
  }
}

var kommuner = ee.FeatureCollection('users/zandersamuel/NINA/Vector/Norway_administrative_kommuner_2022')
kommuner = kommuner.filter(ee.Filter.inList('navn', kommunerNames))
Map.addLayer(kommuner, {}, 'kommuner',0)

var StrataAreas = ee.FeatureCollection([])

var lcChange = ee.Image('projects/nina/GIS_synergy/Extent/Viken/viken_change_dw_trendBased_2016_2022');
Map.addLayer(lcChange, {min:1, max:4, palette:['b6bb5c','ff80f7','17ede3','d0c8bd']}, 'lcChange', 0)

var lc2016 = ee.Image('projects/nina/GIS_synergy/Extent/Viken/viken_9cat_2016');
Map.addLayer(lc2016, lcVizParams, 'lc2016 dw',0);
var lc2022 = ee.Image('projects/nina/GIS_synergy/Extent/Viken/viken_9cat_2022');
Map.addLayer(lc2022, lcVizParams, 'lc2022 dw',0);

var dw = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
  .filterBounds(kommuner)
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

var patchImg = ee.Image(0).paint(geometry, 1)

var ecoTypes = ee.Image('users/zandersamuel/NINA/Raster/Norway_ecosystem_types_5m');
var water = ecoTypes.eq(701).or(ecoTypes.eq(801)).or(ecoTypes.eq(702)).or(ecoTypes.eq(802));
var land = water.eq(0)
land = land.focal_max(50, 'circle', 'meters')
Map.addLayer(land.selfMask(), {}, 'land', 0)

function getImages(startYear, endYear, aoi){
    // Change image -----
  var dwAnnual = [];   
  for (var i = startYear; i <= endYear; i++) { 
    var tmp_probs = dw.select(CLASS_NAMES).filter(ee.Filter.calendarRange(i,i, 'year')).median(); 
    dwAnnual = dwAnnual.concat(tmp_probs.set('system:time_start', (new Date(i,8,1)).valueOf())); 
  }
  dwAnnual = ee.ImageCollection(dwAnnual); 
  
  var lcBaseline = probToCat_2cat(changeTypology_2cat(dwAnnual.median()));
  //Map.addLayer(lcBaseline, {min:0, max:1, palette:['a3c74d','d0c8bd']}, 'lcBaseline',0)
  
  var trendGrey = getTrend(dwAnnual.map(changeTypology).select('grey'));
  //Map.addLayer(trendGrey, {min:-0.1, max:0.1, palette:['17ede3','000000','ff80f7']}, 'trends 2016 to 2022',0);
  
  var changeMap = ee.Image(1).where(lcBaseline.eq(1), 4)
    .where(lcBaseline.eq(0), 1)
    .where(trendGrey.gt(0.05).selfMask(), 2)
    .where(trendGrey.lt(-0.05).selfMask(), 3)
  changeMap = changeMap.where(patchImg, 1)
  changeMap = changeMap.updateMask(land)
  
  Map.addLayer(changeMap.clip(aoi), {min:1, max:4, palette:['b6bb5c','ff80f7','17ede3','d0c8bd']}, 'changeMap',0)
  
  
  var lcStart = dw
    .filter(ee.Filter.calendarRange(startYear,startYear,'year'))
    .reduce(ee.Reducer.median())
    .rename(CLASS_NAMES);
  var lcStartCat = probToCat_9cat(lcStart)
  
  var lcEnd = dw
    .filter(ee.Filter.calendarRange(endYear,endYear,'year'))
    .reduce(ee.Reducer.median())
    .rename(CLASS_NAMES);
  var lcEndCat = probToCat_9cat(lcEnd)
  
  return {
    'changeImg': changeMap,
    'startImg': lcStartCat,
    'endImg': lcEndCat
  }
  
}

// ['Sarpsborg', 'Fredrikstad', 'Asker', 'Bærum', 'Hole', 'Hemsedal', 'Gol', 'Hol']

// For the original iteration I entered the sample sizes manually per kommune
var kommuneSelect = 'Asker';
var aoi = kommuner.filter(ee.Filter.inList('navn', [kommuneSelect])).geometry()

var st = kommuneDict[kommuneSelect]['startYear'];
var ed = kommuneDict[kommuneSelect]['endYear'];
var imgs = getImages(st, ed, aoi);

getSampleSizeRecommendation(imgs['changeImg'], aoi, 
  [0.9, 0.7, 
  0.7, 0.55], 0.02, 500,
  String(kommuneSelect) + '_change_dw_' + String(st) + '_' + String(ed) )

getStratSample_change(imgs['changeImg'],  imgs['startImg'], imgs['endImg'],   aoi, 
  [ 1,2,3,4], 
  [350,50,50,100],
  String(kommuneSelect) + '_change_dw_' + String(st) + '_' + String(ed) ,  123, 234)


// Iterating over kommune to export mapped strata areas
for (var k = 0; k<Object.keys(kommuneDict).length; k++){
  
  var kommuneSelect = Object.keys(kommuneDict)[k];
  var aoi = kommuner.filter(ee.Filter.inList('navn', [kommuneSelect])).geometry()
  
  var st = kommuneDict[kommuneSelect]['startYear'];
  var ed = kommuneDict[kommuneSelect]['endYear'];
  var imgs = getImages(st, ed, aoi);
  
  getSampleSizeRecommendation(imgs['changeImg'], aoi, 
    [0.9, 0.7, 
    0.7, 0.55], 0.02, 500,
    String(kommuneSelect) + '_change_dw_' + String(st) + '_' + String(ed) )
  
  
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
// Functions
function getSampleSizeRecommendation(stratImage, aoi, expectedAccuracies, targetSE, sampleSizeGiven, label){
  
  var STRATALIST = [];
  var AREAWEIGHTS = []
  var NUMSTRATA = [];

  var strataAreas = ee.Image.pixelArea().addBands(stratImage).reduceRegion({
    reducer: ee.Reducer.sum().group(1), 
    geometry: aoi, 
    scale: 10, 
    maxPixels: 1e13
  })
  .evaluate(function(obj) {
    // obj is a list of groups.
    var groups = obj.groups
    var strataAreas = [];
    var totalArea = 0;
    for (var i=0; i<groups.length; i++) {
      STRATALIST.push(groups[i].group)
      strataAreas.push(Math.round(groups[i].sum))
      totalArea+=groups[i].sum
    }
    print('total area', totalArea)
    // Compute the proprtional area
    var check = 0;
    for(var j=0; j<strataAreas.length; j++) {
      AREAWEIGHTS[j] = strataAreas[j] / totalArea;
      check += AREAWEIGHTS[j]
    }
    
    NUMSTRATA = STRATALIST.length
    
    var numeratorList = []
    var tse = targetSE
    for (var i = 0; i < NUMSTRATA; i++){
      var weight = Number(AREAWEIGHTS[i])
      var usAc = Number(expectedAccuracies[i])
      var numerator = weight * Math.sqrt(usAc * (1 - usAc))
      numeratorList.push(numerator)
    }
    
    var numeratorFull = 0
        for (var i=0; i<numeratorList.length; i++){
          numeratorFull += numeratorList[i]
        }
  
    var sampleSize = Math.round(Math.pow((numeratorFull / tse), 2))
    
    if (sampleSizeGiven){
      sampleSize = sampleSizeGiven
    }
    
    var equalAllocation = Math.round(sampleSize / NUMSTRATA)
    
    var propAllocation = []
        for (var i=0; i<AREAWEIGHTS.length; i++){
           var propS = AREAWEIGHTS[i] * sampleSize
           propAllocation.push(Math.round(propS))
        }
    var stableClasses = null;
    
    if (NUMSTRATA == 4){
      stableClasses = [1,4]
    } else if (NUMSTRATA == 16){
      stableClasses = [1,6,11,16]
    }
    var sampleSizeLeft = sampleSize - (stableClasses.length*50)
    var propAllocationMin50 = []
        for (var x=0; x<AREAWEIGHTS.length; x++){
          if ( stableClasses.indexOf( x+1 ) == -1 ){
            propAllocationMin50.push(50)
          } else {
            propAllocationMin50.push(Math.round(AREAWEIGHTS[x] * sampleSizeLeft))
          }
        }
    
    var dict = {
      'NUMSTRATA': NUMSTRATA,
      'STRATALIST': STRATALIST,
      'AREAWEIGHTS':AREAWEIGHTS,
      'Strata Areas [m2]:': strataAreas,
      'sampleSize':sampleSize,
      'equalAllocation':equalAllocation,
      'propAllocation':propAllocation,
      'propAllocationMin50':propAllocationMin50
    }
    StrataAreas = StrataAreas.merge(ee.FeatureCollection(ee.Feature(null, {batch: label, areaList : strataAreas})))
    print(label, dict)
    
    Export.table.toDrive({
      collection: StrataAreas,
      description: label + '_strataAreas',
      fileFormat: 'CSV'
    })
    
    
  })
  
}


function getStratSample_change(stratImage, startImg, endImg, aoi, stratList, sampleSizeList, exportLabel, seed1, seed2){
  
  var sample = stratImage.rename('changeLC')
    .addBands(startImg.rename('startLC'))
    .addBands(endImg.rename('endLC')).stratifiedSample({
     seed: seed1,
     numPoints: 0, // 0 points for pixel values not in 'allocation'
     region: aoi,
     classBand: 'changeLC', // class band name
     classValues: stratList, // pixel values
     classPoints: sampleSizeList, // sample allocation
     tileScale: 2,
     projection: proj,
     scale: 10, 
     geometries: true
  })
  
  sample = sample.randomColumn('PLOTID',seed2)
   sample = sample.map(function(ft){
    var id = ee.String('id_').cat(ee.String(ee.Number(ft.get('PLOTID')).multiply(ee.Number(1e8)).round().int()))
    var lon = ee.Number(ee.List(ft.geometry().coordinates()).get(0)).multiply(100000).round().divide(100000)
    var lat = ee.Number(ee.List(ft.geometry().coordinates()).get(1)).multiply(100000).round().divide(100000)
    return ft
      .set(
        'PLOTID', id,
        'batch', exportLabel,
        'LONGITUDE', lon,
        'LATITUDE', lat,
        'CoordString', ee.String(lat).cat(', ').cat(ee.String(lon)))
  })
  print(sample.limit(10))
  Map.addLayer(sample, {}, 'sample')
  
  //Export.table.toAsset({
  //  collection: sample.sort('PLOTID').select(['PLOTID', 'changeLC', 'startLC','endLC', 'batch']), 
  //  assetId: 'GIS_synergy/Extent/Sampling/' + exportLabel ,
  //  description: exportLabel
  //})
  
  Export.table.toDrive({
    collection: sample.sort('PLOTID'), 
    fileFormat: 'CSV' ,
    description: exportLabel
  })
  
}



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
