<!DOCTYPE html>
<html lang="de">

<head>
    <title>TwinTee 3D View</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="css/style.css">
</head>


<body>

<script src="js/three.min.js"></script>
<script src='js/threex.dynamictexture.js'></script>
<script src="js/ColladaLoader.js"></script>
<script src="js/TrackballControls.js"></script>
<script src="js/Tween.js"></script>
<script src="js/main.js"></script>

<script>

    logo = new Image();

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function changeLogo() {
        while( (typeof baseHead == 'undefined') || !logo.complete) {
            await sleep(500);
            console.log("slept 500ms");
        }

        console.log("typeof baseHead !== undefined");
        baseHead.material.map.image = logo;

        // scale texture
        baseHead.material.map.repeat.set(0.8,0.8);
        baseHead.material.map.offset.set(0.1,0.1);

        baseHead.material.map.needsUpdate = true;
    }

    <?php if ( !empty($_POST['message']) ): ?>
        console.log("got image via POST request");

        logo.onload = function() {

          changeLogo();

        }

        logo.src = "<?php print($_POST['message']) ?>";
    <?php endif ?>

</script>


<!-- nav and corresponding css modified from https://codepen.io/erikterwan/pen/EVzeRP -->
<!--    Made by Erik Terwan    -->
<!--   24th of November 2015   -->
<!--        MIT License        -->
<nav>
    <div id="menuToggle">
        <!--
        A fake / hidden checkbox is used as click receiver,
        so we can use the :checked selector on it.
        -->
        <input id="hidden_checkbox" type="checkbox" />

        <!--
        Some spans to act as a hamburger menu.
        -->
        <span></span>
        <span></span>
        <span></span>

        <ul id="menu">
            <li>
                <img style="display: block; margin-left: auto; margin-right: auto; margin-bottom: 32px;" src="img/twintee-logo.png" alt="TwinTee Logo" />
            </li>

            <li><a id="head" href="#">Kopfansicht</a></li>
            <li><a id="side" href="#">Seitenansicht</a></li>
            <li><a id="tilted" href="#">3D Ansicht</a></li>

            <li>
                <a id="engraving" href="#"><img id="icon_visibility" src="css/img/visible.png" width="32" height="32" alt="Visibility Icon" />Beschriftung</a>
            </li>

            <li>
                <input id="engravingText" maxlength="18" placeholder="Engraving" />
            </li>

            <li>
                <span class="nobr" id="z000" title="Schwarz" style="height: 24px; width: 24px; background-color:#000"></span>
                <span class="nobr" id="zF541B7" title="Pink (PANTONE 813 U)" style="height: 24px; width: 24px; background-color:#F541B7">&nbsp;</span>
                <span class="nobr" id="z3BD23D" title="Grün (PANTONE 802 U)" style="height: 24px; width: 24px; background-color:#3BD23D">&nbsp;</span>
                <span class="nobr" id="z1295D8" title="Blau (PANTONE 299 U)" style="height: 24px; width: 24px; background-color:#1295D8">&nbsp;</span>
                <span class="nobr" id="zFF8767" title="Orange (PANTONE 811 U)" style="height: 24px; width: 24px; background-color:#FF8767">&nbsp;</span>
                <span class="nobr" id="ze4e83b" title="Gelb (PANTONE 809 U)" style="height: 24px; width: 24px; background-color:#e4e83b">&nbsp;</span>
                <span class="nobr" id="zfff" title="Weiß" style="height: 24px; width: 24px; background-color:#fff">&nbsp;</span>
            </li>

            <li>
            <p id="teeDescription">The bottom of TWiNTEE is a high quality wood with better rigidity/ toughness ratio for more good shots. The top material is much more flexible and softer to give the hybrid golf tee its luxury standard. The use of leading golf ball cover material confirms this standard. Further developements of IB STEINER strengthen the usage of biobased materials for TWiNTEE components.</p>
            </li>

            <li>
                <a id="engravedBy" href="https://www.edelraster.at/" target="_blank">Engraving by <img src="img/edelraster_logo.png" alt="edelraster.at" /></a>
            </li>

        </ul>
    </div>
</nav>

<section>
    <div class="loading" id="loader">
        <div class="loading-text">
            <span class="loading-text-words">L</span>
            <span class="loading-text-words">O</span>
            <span class="loading-text-words">A</span>
            <span class="loading-text-words">D</span>
            <span class="loading-text-words">I</span>
            <span class="loading-text-words">N</span>
            <span class="loading-text-words">G</span>
        </div>
    </div>
</section>

<a href="https://visuplan.at">
    <img id="visuplan" src="img/visuplan-3d-visualisierungen-logo.png" alt="Logo Visuplan" />
</a>

<div id="line">
    <hr/>
</div>

<script src="js/listeners.js"></script>

</body>

</html>