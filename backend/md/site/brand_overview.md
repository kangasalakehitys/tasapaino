# Visualization rules for organization

## Colors
### Color palettes
Main color: #DE232F
Sub colors: 
#FCB316, 
#28336C,
#E64925,
#00ADC5, 
#009651
Use transparency if colors aren't enough

Color order:
1. #DE232F
2. #FCB316, 
3. #28336C, 
4. #E64925,
5. #00ADC5, 
6. #009651
Use transparency if colors aren't enough


## Typefaces
### Fonts
Overall font-type
- brand/fonts/centurygothic.ttf
Labelling only
- brand/fonts/centurygothic_bold.ttf

## Tables
- Create using components that can be used in different places
- Keep tables formating as simple as possible. Use Only two colors.
- If possible give sorting option for columns
- font-size: 11px; text-align: center
- If there is change procent calculations, show positive numbers using #009651 color and negative #DE232F
- Create unique id for tables
- Use Typefaces -> Fonts

## Graphs, charts, maps and other visualizations
- Create using components that can be used in different places
- Use data storytelling principles, less numbers and professional looking graphs and visualizations
- Always use transparent background color on graphs and visualizations
- Always use transparent border color on graphs and visualizations
- Create always so that they are easy exported to png, jpg, svg, csv format.
- Create always png, jpg, svg and csv icons to download graphs and visualizations from pages
- Create always so that there is zooming option
- If zooming goes closer then change x-axes scale so that it show the change. For example years to years months.
- Don't include zoom on png, jpg, svg and csv downloads.
- Create unique id for graphs, charts, maps and other visualizations
- Format y- and x-axes font size to 14px
- Use Typefaces -> Fonts
- Layouts: 
    - if 2-3 columns use 2-col span
- Use Tufte's Six Principles for Graphical Integrity
    - Comparisons: Data must be shown in comparison to dependent variables. An isolated number is meaningless.
    - Causality: The design must demonstrate how independent variables impact dependent variables.
    - Multivariate Analysis: Authority comes from showing complex, multi-variable relationships.
    - Integration: Text, maps, and numbers must be integrated, not segregated.
    - Documentation: Credibility requires attribution and detailed titling.
    - Content Focus: The design must serve the content, not the designer.

### Line charts
- Use line smoothing: smooth: 0.5
- Use line width: 2.5
- Show marker symbol in every value.
- Use marker symbol with the same color then the line
- Use marker borderColor: '#ffffff', borderWidth: 2, borderType: 'solid'
- On y-axes use gridlines
- y-axes gridline lineStyle: { type: 'dashed', color: '#E0E0E0',width: 1 }
- Use axisLabels and Legends: { fontWeight: 'normal', color: '#000000'}
- Use Typefaces -> Fonts

### Cleveland dot plot
A Cleveland dot plot is a data visualization that uses position along a shared scale to compare quantitative values across categorical groups, serving as a clean, low-clutter alternative to traditional bar charts.

- Categories are listed vertically on one axis, while quantitative values are marked by dots along the horizontal axis.
- Reduced Clutter: It avoids the heavy ink and visual crowding of filled rectangular bars, making it ideal when dealing with dozens of categories or small value differences.
- Use Typefaces -> Fonts

Common Variations
- Standard Dot Plot: Displays a single dot per category to show rankings or point estimates.
- Lollipop Chart: A dot plot where a thin line connects each dot to the baseline or axis.
- Dumbbell Plot: Features two dots per category (connected by a line) to show before-and-after, target-versus-actual, or paired group comparisons.

When to Use It
- You have many categories (more than a dozen) that would crowd a standard bar chart.
- Small differences matter and need to be easily detectable by the human eye.
- You want to emphasize a clear ranking order of items or identify outliers quickly.

- The main markers are the ones you want to emphasize with different colors.
- Use main marker borderWidth: 2, borderType: 'solid'. Main markers size is 20% bigger then sub-markers
- Sub-markers are those that are present but in the background. Use same color with all the sub-markers color opacity: 0.5 borderWidth: 0. Sub-markers are 20% smaller then main markers.
- Both are shown in the legend
- Use gridlines on both y- and x-axes
- y-axes gridline lineStyle: { type: 'dashed', color: '#E0E0E0',width: 1 }
- Use axisLabel: { fontWeight: 'bold', color: '#000000'}

### New municipality category
- Create a new category based on population size
    - Alle 2000: from 0 to 1999
    - 2000 - 5000: from 2000 to 5000
    - 5001 - 10000: from 5001 to 10000
    - 10001 - 20000: from 10001 to 20000
    - 20001 - 40000: from 20001 to 40000
    - 40001 - 100000: from 40001 to 100000
    - Yli 100000: over 100000

### Maps
- Use borderColor = "#525252";
- Land color #f4f2ee;
- Sequential Colour scale combinations;
- Use Typefaces -> Fonts

9-class OrRd:
#fff7ec
#fee8c8
#fdd49e
#fdbb84
#fc8d59
#ef6548
#d7301f
#b30000
#7f0000

9-class PuBu:
#fff7fb
#ece7f2
#d0d1e6
#a6bddb
#74a9cf
#3690c0
#0570b0
#045a8d
#023858

9-class BuGn:
#f7fcfd
#e5f5f9
#ccece6
#99d8c9
#66c2a4
#41ae76
#238b45
#006d2c
#00441b

9-class Reds:
#fff5f0
#fee0d2
#fcbba1
#fc9272
#fb6a4a
#ef3b2c
#cb181d
#a50f15
#67000d

9-class Blues:
#f7fbff
#deebf7
#c6dbef
#9ecae1
#6baed6
#4292c6
#2171b5
#08519c
#08306b

- Diverging Colour scale combinations
11-class PiYG:
#8e0152
#c51b7d
#de77ae
#f1b6da
#fde0ef
#f7f7f7
#e6f5d0
#b8e186
#7fbc41
#4d9221
#276419

11-class RdBu:
#67001f
#b2182b
#d6604d
#f4a582
#fddbc7
#f7f7f7
#d1e5f0
#92c5de
#4393c3
#2166ac
#053061

11-class RdYlGn:
#a50026
#d73027
#f46d43
#fdae61
#fee08b
#ffffbf
#d9ef8b
#a6d96a
#66bd63
#1a9850
#006837

## Powerpoint
Title Slide: 
- Change slide background image to brand/photos/powerpoint/front_bg_red.jpg 
- Font-size title: 48+ points
- Font-color: #FFFFFF
- Action Title (top) - full sentence stating the conclusion
- Body (middle) - charts/infographics with supporting evidence
- Footer (bottom) - source attribution (e.g., "Kuntatietojulkaisu")

Sub-title slides:
Change slide background image randomly for one of these
- brand/photos/powerpoint/head_blue_bg.jpg
- brand/photos/powerpoint/head_cyan_bg.jpg
- brand/photos/powerpoint/head_grey_bg.jpg
- brand/photos/powerpoint/head_orange_bg.jpg
- brand/photos/powerpoint/head_yellow_bg.jpg
- Font-size title: 36+ points

Content slides:
Change slide background image to
- brand/photos/powerpoint/txt_bg_white.jpg
- Font-size title: 36
- Normal text slide title font-color: #E01F27
- Normal text slide font-color: #000000
- Normal text font-size: 16+ points

Last slide of presentation:
Change last slide background image randomly for one of these:
- brand/photos/powerpoint/head_pic_1_bg.jpg
- brand/photos/powerpoint/head_pic_2_bg.jpg
- brand/photos/powerpoint/head_pic_3_bg.jpg
- brand/photos/powerpoint/head_pic_4_bg.jpg
- brand/photos/powerpoint/head_pic_5_bg.jpg
- brand/photos/powerpoint/head_pic_6_bg.jpg
- Font-size: 48+ points

### Other Powerpoint notes
- Take graphs, charts, maps and other visualizations on powerpoint in png format
- Take analysis
- Take summary
- Try to include tables, analysis, summary and graphs, charts, maps and other visualizations on one slide per theme
- Use infograpics
- Use icons
- Use simple maps in visualization if needed
- Use timelines if needed




