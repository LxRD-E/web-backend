request('/game/search').then((d) => {
    const ids = [];
    let catalogIds = [];
    const topList = $('#topTwoGames');

    let index = 0;
    for (const game of d) {
        if (index === 0 || index === 1) {
            let thumbId = game.thumbnailAssetId;
            let img = '';
            if (thumbId === 0) {
                img = `<img src="https://cdn.hindigamer.club/game/default_assets/Screenshot_5.png" style="width:100%;object-fit: fill;display:block;margin: 0 auto;height: 200px;" />`
            }else{
                img = `<img data-catalogid="${thumbId}" style="width:100%;object-fit: fill;display:block;margin: 0 auto;height: 200px;" />`
                catalogIds.push(thumbId);
            }
            topList.append(`
            <div class="col-12 col-md-6">
            <div class="card">
                <a href="/game/${game.gameId}" class="hidehover">
                    <div class="card-body" style="cursor:pointer;">
                        <div class="row">
                            <div class="col-12">
                                <h1 style="overflow: hidden;
                                white-space: nowrap;
                                text-overflow: ellipsis;">${filterXSS(game.gameName)}</h1>
                            </div>
                            <div class="col-6 col-md-8">
                                ${img}
                            </div>
                            <div class="col-6 col-md-4">
                                <img src="" data-userid="${game.creatorId}" style="width:100%;" />
                                Created By <span data-userid="${game.creatorId}"></span>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-12" style="padding-top:1rem;">
                                <p>${game.playerCount} Playing</p>
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        </div>`);
        }else{
            let thumbId = game.iconAssetId;
            let img = '';
            if (thumbId === 0) {
                img = `<img src="https://cdn.hindigamer.club/game/default_assets/Screenshot_5.png" style="width:100%;object-fit: fill;display:block;margin: 0 auto;height: 150px;" />`
            }else{
                img = `<img data-catalogid="${thumbId}" style="width:100%;object-fit: fill;display:block;margin: 0 auto;height: 150px;" />`
                catalogIds.push(thumbId);
            }
            $('#popularGamesList').append(`
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card">
                    <a href="/game/${game.gameId}" class="hidehover">
                        <div class="card-body" style="cursor:pointer;">
                            <div class="row">
                                <div class="col-12">
                                    <h1 style="overflow: hidden;
                                    white-space: nowrap;
                                    text-overflow: ellipsis;font-size:1rem;">${filterXSS(game.gameName)}</h1>
                                </div>
                                <div class="col-12">
                                    ${img}
                                </div>

                            </div>
                            <div class="row" style="padding-top:1rem;">
                                <div class="col-12">
                                    <p>${game.playerCount} Playing</p>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
            
            `);
        }
        if (game.creatorType === 0) {
            ids.push(game.creatorId);
        }
        index++;
    }
    setUserNames(ids);
    setUserThumbs(ids);
    setCatalogThumbs(catalogIds);
}).catch((e) => {
    warning(e.responseJSON.message);
})