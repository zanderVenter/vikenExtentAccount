#### Import mapped land cover labels -------------------------------------------

# There were two iterations of reference points
  # the "legacy" folder included all water bodies
  # the parent folder included only water within 50m of land
  # all water points from the legacy set will be assumed to be water to water
readMultiFiles('./DATA/From_GEE/verification_points/')  %>%
  ggplot(aes(x=factor(startLC))) +
  geom_bar(stat='count') +
  coord_flip()
readMultiFiles('./DATA/From_GEE/verification_points/legacy/')  %>%
  ggplot(aes(x=factor(startLC))) +
  geom_bar(stat='count') +
  coord_flip()

# Bring in the samples
mapped <- readMultiFiles('./DATA/From_GEE/verification_points/') %>%
  mutate(kommune = strsplit(batch, '_') %>% map_chr(., 1),
         m = ifelse(changeLC == 1, 'ikke bebygd - stabil',
                    ifelse(changeLC == 2, 'nedbygging', 
                           ifelse(changeLC == 3, 'gjengroing', 'bebygd - stabil')))) %>%
  dplyr::select(PLOTID, kommune, m)

mapped %>%
  filter(kommune == 'Asker') %>%
  group_by(m) %>%
  summarise(n=n())

mapped
nrow(mapped)
length(unique(mapped$PLOTID))

# Bring in the legacy samples where we assume water to water is true
mapped_legacy <- readMultiFiles('./DATA/From_GEE/verification_points/legacy/') %>%
  filter((startLC == 8 & endLC == 8)) %>%
  mutate(kommune = strsplit(batch, '_') %>% map_chr(., 1),
         m = 'ikke bebygd - stabil') %>%
  filter(kommune != 'Asker') %>%
  dplyr::select(PLOTID, kommune, m)
mapped_legacy %>% group_by(kommune) %>% summarise(n=n())

# Join the two
mapped <- mapped %>%
  bind_rows(mapped_legacy)

unique(mapped$kommune)

#### Import reference/verified land cover labels -------------------------------------------


# !NB need to add the legacy points as reference too
read_excel('./DATA/From_samplers/Hol_datainnsamling.xlsx') 

importReference <- function(fileName, kommune){
  ref <- read_excel(paste0('./DATA/From_samplers/', fileName, '.xlsx')) %>%
    mutate(startLC = ifelse(.[[5]] %in% c('Bebygd'), 'bebygd', 'ikke bebygd'),
           endLC = ifelse(.[[6]]  %in% c('Bebygd'), 'bebygd', 'ikke bebygd')) %>%
    mutate(r = ifelse((startLC == 'bebygd' & endLC == 'bebygd'), 'bebygd - stabil',
                      ifelse((startLC == 'bebygd' & endLC == 'ikke bebygd'), 'gjengroing',
                             ifelse((startLC == 'ikke bebygd' & endLC == 'bebygd'), 'nedbygging', 'ikke bebygd - stabil'))),
           kommune = kommune) %>%
    dplyr::select(PLOTID,kommune,  r)
  
  return (ref)
}

reference <- importReference('Fredrikstad_datainnsamling', 'Fredrikstad') %>%
  bind_rows(importReference('Hol_datainnsamling', 'Hol'))%>%
  bind_rows(importReference('Sarpsborg_datainnsamling', 'Sarpsborg'))%>%
  bind_rows(importReference('Hole_datainnsamling', 'Hole'))%>%
  bind_rows(importReference('Hemsedal_datainnsamling', 'Hemsedal'))%>%
  bind_rows(importReference('Gol_datainnsamling', 'Gol'))%>%
  bind_rows(importReference('Barum_datainnsamling (1)', 'Bærum'))%>%
  bind_rows(importReference('Asker_datainnsamling', 'Asker'))
reference
unique(reference$r)


reference %>%
  group_by(kommune) %>%
  summarise(n=n())


# Bring in the legacy samples where we assume water to water is true
reference_legacy <- readMultiFiles('./DATA/From_GEE/verification_points/legacy/') %>%
  filter((startLC == 8 & endLC == 8)) %>%
  mutate(kommune = strsplit(batch, '_') %>% map_chr(., 1),
         r = 'ikke bebygd - stabil') %>%
  dplyr::select(PLOTID, kommune, r) %>%
  filter(kommune %in% unique(reference$kommune))


reference <- reference%>%
  bind_rows(reference_legacy)


reference %>%
  ggplot(aes(x = r, fill=r)) + 
  geom_bar(stat='count') +
  coord_flip() + 
  scale_fill_manual(values = c('#d0c8bd','#17ede3','#b6bb5c', '#ff80f7')) +
  theme_bw() +
  theme(legend.position = 'none',
        axis.title.y = element_blank())

#### Import mapped area changes --------------------------------------------------

strataAreas <- readMultiFiles('./DATA/From_GEE/strata_areas/') %>%
  mutate(kommune = strsplit(batch, '_') %>% map_chr(., 1)) %>%
  dplyr::select(kommune, areaList) %>%
  distinct() %>%
  mutate(areaList = str_sub(areaList, 2,-2),
         areaList = str_split(areaList, ','))
strataAreas

#### Quantify uncertainty values per kommune --------------------------------------

combined <- reference %>%
  left_join(mapped, by = c('PLOTID', 'kommune')) %>%
  drop_na(r)
View(combined %>% filter(m != r))

combined %>%
  gather(type, val, m, r) %>%
  ggplot(aes(x=type, fill=val)) +
  geom_bar(position = 'dodge') +
  facet_wrap(~kommune)

cm <- confusionMatrix(factor(combined$m), factor(combined$r))
cm

accountOut <- tibble()
kommuner <- unique(combined$kommune)

k <- 'Fredrikstad'

for (k in kommuner){
  
  combinedSelect <- combined %>%
    filter(kommune == k)
  
  areaListSelect <- strataAreas %>%
    filter(kommune == k)
  
  
  Nh <- c('ikke bebygd - stabil'=as.numeric(areaListSelect$areaList[1][[1]][1]),
          'nedbygging'=as.numeric(areaListSelect$areaList[1][[1]][2]),
          'gjengroing'=as.numeric(areaListSelect$areaList[1][[1]][3]),
          'bebygd - stabil'=as.numeric(areaListSelect$areaList[1][[1]][4]))
  
  r <- combinedSelect$r
  m <- combinedSelect$m
  
  e<-olofsson2(r, m, Nh)
  e
  
  changeDF <- tibble()
  for (i in seq(1, length(e$area))){
    subChangeDF <- tibble(
      class = rownames(e$matrix)[i],
      area = e$area[i]*sum(Nh)/1000000 ,
      prop =  e$area[i],
      perc = prop*100,
      ciArea = (qnorm(0.975)*e$SEa[i]*sum(Nh))/1000000, #/2,
      ciProp = (qnorm(0.975)*e$SEa[i]) #/2
    )
    changeDF <- changeDF %>% bind_rows(subChangeDF)
  }
  changeDF$Nh <- Nh/1000000
  changeDF$NhProp <- Nh/sum(Nh)/1000000
  changeDF$kommune <- k
  
  accountOut <- accountOut %>%
    bind_rows(changeDF)
  
}

accountOut %>%
  gather(source, area, area, Nh) %>%
  ggplot(aes(x=class, y=area, fill=source)) + 
  geom_bar(stat='identity', position = 'dodge') +
  geom_errorbar(aes(ymax=area+ciArea, ymin=area-ciArea), width=0.15, position = position_dodge(0.75)) +
  facet_wrap(~kommune) +
  coord_flip()

uncertaintyDF <- accountOut %>%
  mutate(percError = ciArea/area*100) %>%
  mutate(navn = kommune) %>%
  dplyr::select(class, navn, percError)

#### Import land cover areas for all Viken 2016-2022 -----------------------------------------

## 2-class accounting tables with uncertainty (4-class change typology)
lcChange <- read_csv('./DATA/From_GEE/all_kommune_areas/dw_areas_dwChange_2016_2022.csv') %>%
  mutate(class = ifelse(classNumber == 1, 'ikke bebygd - stabil',
                    ifelse(classNumber == 2, 'nedbygging', 
                           ifelse(classNumber == 3, 'gjengroing', 'bebygd - stabil'))),
         area = area/1000000) %>%
  dplyr::select(kommunenum, navn, class, area) 

lcChangeUncert <- uncertaintyDF %>%
  left_join(lcChange, by = c('navn', 'class')) %>%
  mutate(ciArea = area*percError/100) %>%
  group_by(navn) %>%
  mutate(areaTot = sum(area)) %>%
  ungroup() %>%
  mutate(prop = area/areaTot)
  


lcChangeUncert%>%
  mutate('95% CI' = ciArea,
         Areal = area,
         'Areal type' = class) %>%
  dplyr::select(navn, 'Areal type', area, '95% CI') %>%
  write_csv('./DATA/For_GEE/extent_accounts_2class_uncertainty.csv')

## 9-class accounting tables

lc2022 <- read_csv('./DATA/From_GEE/all_kommune_areas/dw_areas_dw2022.csv') %>%
  mutate(type = 'Closing') %>%
  group_by(navn, kommunenum, type, classNumber) %>%
  summarise(area = sum(area))
lc2022

lc2016 <- read_csv('./DATA/From_GEE/all_kommune_areas/dw_areas_dw2016.csv') %>%
  mutate(type = 'Opening') %>%
  group_by(navn, kommunenum, type, classNumber) %>%
  summarise(area = sum(area))

extent_accounts_9class <- lc2022 %>%
  bind_rows(lc2016) %>%
  mutate(area = area/1000000,
         lc = recode_factor(factor(classNumber), `1` = 'Bebygd',
                            `2` = 'Avling',
                            `3` = 'Barmark',
                            `4` = 'Gress',
                            `5` = 'Busk',
                            `6` = 'Skog',
                            `7` = 'Våtmark',
                            `8` = 'Vann',
                            `9` = 'Snø og is')) %>%
  dplyr::select(-classNumber) %>%
  pivot_wider(values_from=area, names_from = type) %>%
  mutate(Change = Closing-Opening) %>%
  gather(year, val, Closing:Change) %>%
  pivot_wider(values_from=val, names_from=lc)

extent_accounts_9class %>%
  mutate(year = ifelse(year == 'Opening', "2016",
                       ifelse(year == 'Closing', "2022", "Endring"))) %>%
  write_csv('./DATA/For_GEE/extent_accounts_9class.csv')




#### Transfer uncertainty values to selected kommune 2016-2022 ---------------------------------

kommune <- 'Fredrikstad'
makeChangePlot <- function(kommune){
  toPlot <- lcChangeUncert %>%
    filter(navn == kommune) %>%
    mutate(type = ifelse(class %in% c('nedbygging', 'gjengroing'), 'Endring', 'Stabil'))
  
  p1 <- toPlot %>%
    filter(type == 'Stabil') %>%
    ggplot(aes(x=class, y=area, fill=class)) + 
    geom_bar(stat='identity', position = 'dodge') +
    geom_errorbar(aes(ymax=area+ciArea, ymin=area-ciArea), 
                  width=0.15, position = position_dodge(0.75))+
    geom_text(aes(label = paste0(round(prop*100, 1), '%'), y=0), size=3, hjust=-0.2, vjust = -1.5) +
    coord_flip() +
    scale_fill_manual(values = c('#d0c8bd','#b6bb5c')) +
    theme_bw() +
    geom_hline(yintercept = 0, linewidth=0.25) + 
    scale_x_discrete(labels = c('bebygd\nstabil','ikke bebygd\nstabil')) +
    ggtitle('A) Stabil') +
    theme(legend.position = 'none',
          #axis.text.x = element_text(angle = 45),
          axis.title.x = element_blank(),
          axis.title.y = element_blank()) 
    p1
    p2 <- toPlot %>%
      filter(type == 'Endring') %>%
      ggplot(aes(x=class, y=area, fill=class)) + 
      geom_bar(stat='identity', position = 'dodge') +
      geom_errorbar(aes(ymax=area+ciArea, ymin=area-ciArea), 
                    width=0.15, position = position_dodge(0.75))+
      geom_text(aes(label = paste0(round(prop*100, 1), '%'), y=0), size=3, hjust=-0.2, vjust = -1.5) +
      coord_flip() +
      scale_fill_manual(values = c('#17ede3', '#ff80f7')) +
      theme_bw() +
      geom_hline(yintercept = 0, linewidth=0.25) + 
      labs(y = 'Areal (km2)')+
      ggtitle('B) Endring') +
      theme(legend.position = 'none',
            axis.title.y = element_blank()) 
    p2
    
    fig <- grid.arrange(p1, p2, nrow=2, heights=c(1,1), padding = unit(0, "line"), newpage = T) 
    fig
    
    ggsave(paste0("./figures/", kommune, ".png"), fig, width = 20, height=12, units='cm')
    
}


makeChangePlot('Asker')
makeChangePlot('Bærum')
makeChangePlot('Fredrikstad')
makeChangePlot('Gol')
makeChangePlot('Hemsedal')
makeChangePlot('Hol')
makeChangePlot('Hole')
makeChangePlot('Sarpsborg')

 



# football fields
changeDF %>%
  mutate(area = area / (65*100*0.01),
         ciArea = ciArea / (65*100*0.01)) %>%
  ggplot(aes(x=class, y=area)) + 
  geom_bar(stat='identity', position = 'dodge') +
  geom_errorbar(aes(ymax=area+ciArea, ymin=area-ciArea), width=0.15, position = position_dodge(0.75))
