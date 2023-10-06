# vikenExtentAccount
Creating ecosystem extent accounts for 8 municipalities in Viken county, Norway, with the use of Dynamic World and design-based area estimation

## Input datasets:
- [Dynamic World](https://dynamicworld.app/) provides land cover maps derived from Sentinel-2 imagery
- [Norwegian municipality boundaries](https://kartkatalog.geonorge.no/metadata/administrative-enheter-kommuner/041f1e6e-bdbc-4091-b48f-8a5990f3cc5b) used to define the accounting areas used in the project
- [AR5 and AR50](https://kartkatalog.geonorge.no/metadata/fkb-ar5-land-resource-map-15000-land-type/280bbd7a-5ce9-4c83-9e15-ac162cabd8a6) are national land use/cover datasets covering a range of time-points depending on when municiaplities are re-mapped. Here it is used to isolate oceans which are invariable over time.

## The workflow:
The workflow spans two platforms: RStudio Server and Google Earth Engine. The land cover data processing, stratified sample generation, and web-app deployment happens in Google Earth Engine. The area estimation and graph production happens in R. In future it would be ideal to perform the entire workflow in one platform to prevent the need for moving data back and forth. At the moment this repository is setup as an RProject folder. The JavaScript files from Google Earth Engine are placed in the ./SCR/ directory although they can only be run in Google Earth Engine.

The basic workflow is as follows: (i) generate maps of land cover change between two time points, (ii) generate a stratified sample of locations to verify manually using visual interpretation of orthophotos according to a sampling design and protocol - here we repurpose scripts from the [AREA2 tool](https://area2.readthedocs.io/en/latest/overview.html) in Google Earth Engine, (iii) use the stratified samlpe and the land cover maps to estimate areas using design-based area estimators outlined in [Olofsson et al 2014](https://www.sciencedirect.com/science/article/pii/S0034425714000704) using the R package [mapaccuracy](https://cran.r-project.org/web/packages/mapaccuracy/mapaccuracy.pdf), (iv) visualize the area estimates with 95% confidence intervals as graphs and extent accounting tables, (v) upload and display in an interactive web application.

The scripts should be run in the order below, with intermediate steps involving manual movement of files to appropriate project directories.
1. dynamic_world_mosaics.js - mosaics Dynamic World into annaul composites and then exports a 2016 and 2022 9-class typology map, and a 4-class transition map.
2. generate_sampling_points.js - use functions adopted from AREA2 tool to firstly estiamte the number of sampling points needed per land cover class (strata), and secondly generate stratified random sample per municipality. 
At this point you will have files in your Google Drive that you need to download and format so that samplers can use them in combination with Norgeibilder to label land cover types and transitions for each sampling point. The files can also be placed in ./DATA/From_GEE/verification_points/ directory. Once the samplers are complete, the data can be placed here: ./DATA/From_samplers/
4. dynamic_world_area_aggregation.js - sum the pixel areas per land cover class and transition class (ie. pixel counting).
At this point you will have files in your Google Drive that you need to download ./DATA/From_GEE/strata_areas
5. setup.R - this is run in RStudio and installs relevant libraries and initialises global functions like the area estimation fundtion
6. area_estimation.R - this uses the sampling points (reference) and map areas to generate area estimates with 95% confidence intervals. It will generate figures of area changes and two CSV files to the ./DATA/For_GEE/ directory. These files can be uploaded to GEE Assets folder and will be used in the web app script next.
7. viken_accounts_app.js - code to generate the GEE app.

