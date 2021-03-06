/* two column version of wfinfinitelist 
  by jfwf@yeah.net 2014.10.
*/
/* need angular.js and iscroll-infinite-wf4.js 
    
    --- new ----
    1.Because wrapper should be the first child of the directive,
      there should be nothing between <wf-infinite-list4> and </wf-infinite-list4>,
      even newline is bad.
      e.g. <wf-infinite-list4></wf-infinite-list4> is ok.
           <wf-infinite-list4> </wf-infinite-list4> is bad.
           <wf-infinite-list4>something</wf-infinite-list4> is bad.
           <wf-infinite-list4><p>text</p></wf-infinite-list4> is bad.
           <wf-infinite-list4>
           </wf-infinite-list4> is bad.

    2.Height of <wf-infinite-list4> should be defined or could be calculated by style.

    3.<wf-infinite-list3> have following attrs:
      required attrs:
      delegate         = object: 
    
      optional attrs:
        two-column = false ; true for two column , false for one column.
        push-enable = false ;
        pull-enable = false ;
        start-scroll-y = 0  ;

        push-trigger-offset = 60
        push-start-html     = 'push to refresh'
        push-release-html   = 'release for refresh'
        push-loading-html   = 'refreshing'

        pull-trigger-offset = 60
        pull-start-html     = 'pull to load more'
        pull-release-html     = 'release for load'
        pull-loading-html     = 'loading...'
        pull-nothing-html     = 'no more load' 

    4. delegate must have following methods:
        $scope.delegate = {} ;
        $scope.delegate.onData=function(el,index)
        {//el:element ; index:dataindex.
          el.innerHTML = 'data' ;
        } ;
        $scope.delegate.onCellHeight=function(index)
        {//index:index : dataindex .
          // if($scope.sref.isTwoColumnMode(){}
          return 80 ;
        } ;
        $scope.delegate.onPushTriggered=function(sref)
        {//sref:scroller reference.
          $scope.loadPage($scope.url1,1,$scope.pageSize,sref) ;
        } ;
        $scope.delegate.getDataCount=function()
        {//lr:0-left,1-right.
          return $scope.datapool.length ;
        } ;
        $scope.delegate.onPullTriggered=function(sref)
        {//sref:scroller reference.
          $scope.loadPage($scope.url1,ipage,$scope.pageSize,sref) ;
        } ;
        $scope.delegate.onCellTapped=function(dind)
        {//dind:dataindex
          console.log('tap : '+dind) ;
        }
        $scope.delegate.onScrollerReady=function(sref)
        {
          $scope.sref = sref ;
        } ;
        //optional
        $scope.loadPage = function(url0,ipage,pagesize,sref)
        {
          if( ipage!=1 && ipage != $scope.scrollInfo.loadedPage+1 )
          {
            sref.pushPullLoadingFinished(false , false );
            return ;
          }
          var url1 = url0+'?page='+ipage+'&page_size='+pagesize+'&cb=JSON_CALLBACK';
          $http.jsonp(url1)
          .success(function(data){
            if(ipage==1) $scope.cleanScrollDataInfo() ;
            $scope.scrollInfo.limit = data.result.count ;
            for(var i = 0 ; i<data.result.arts.length ; i++ )
              $scope.datapool.push(data.result.arts[i]) ;
            $scope.scrollInfo.loadedPage = ipage ;
            sref.pushPullLoadingFinished(true , ($scope.scrollInfo.limit==$scope.scrollInfo.valid) );
          })// end of success.
          .error(function(data){
            sref.pushPullLoadingFinished(false , false );
          }) ;// end of error and jsonp.
        } ;

    5. After push or pull finished
        sref.pushPullLoadingFinished(isOk , isAll ); must be called.


    6. sref useful functions:
      sref.isTwoColumnMode() ; true-two column, false-one column.
      sref.setPushEnable(usePush) ;
      sref.setPushEnable(usePush) ;
      sref.pushLoadBegin() ;
      sref.pullLoadBegin() ;
      sref.scrollTo(x,y) 
      sref.refresh() ;
      sref.reorderInfinite() ;
      sref.getCellElementByDataIndex(index,lr) ;

    7. cellElement useful properties:
        element.dindex : index in datasource.
    

*/
angular.module('Wangf',['ngAnimate'])
  .directive('wfInfiniteList4',function($http,$timeout){
    return {
      restrict:'E' ,
      template:"<div style='position:absolute;width:100%;top:0px;bottom:0px;left:0px;overflow:hidden;'>"
              +"<div style='position:absolute;top:0px;left:0px;margin:0px;padding:0px;width:100%;'>"
              
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"

              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"

              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"


              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"

              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"

              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"
              +"<div style='position:absolute;top:0px;left:0px;width:100%;margin:0px;padding:0px;height:44px;' ng-click='tapped($event.target)'></div>"

              +"<div style='position:absolute;width:100%;top:-44px;left:0px;height:44px;'>push for updating.</div>"
              +"<div style='position:absolute;width:100%;top:9999px;left:0px;height:44px;'>pull for loading.</div>"

              +"</div>"
              
              +"</div>",
      transclude: false,
      scope:{
              delegate:"=",
              twoColumn:'@',
              pushEnable:'@',
              pullEnable:'@',
              pushTriggerOffset:'@',
              pushStartHtml:'@',
              pushReleaseHtml:'@',
              pushLoadingHtml:'@',
              pullTriggerOffset:'@',
              pullStartHtml:'@',
              pullReleaseHtml:'@',
              pullLoadingHtml:'@',
              pullNothingHtml:'@',
              startScrollY:'@'
            },
      compile: function (element, attrs, transclude) { 

          return function(scope,element,attrs)
          {
            scope.twoColumn = ( ( scope.twoColumn||'false' ) ==='true' )?true:false ;
            var wrapper = element[0].firstChild ;
            var scroller = wrapper.firstChild ;
            scope.cells = [] ;
            var cells = scroller.childNodes ;
            for(var i = 0 ; i<15 ; i++ )
            {
              scope.cells[i*2+0] = cells[2*i+0] ;
              scope.cells[i*2+1] = cells[2*i+1] ;
            }
            var pushcell = cells[30] ;
            var pullcell = cells[31] ;

            scope.scrollList = new IScroll({
              tap:true ,
              wrapper:wrapper,
              scroller:scroller,
              delegate:scope.delegate , 
              cells:scope.cells,
              twocolumn:scope.twoColumn,
              pushcell:pushcell,
              pullcell:pullcell,
              pushenable:scope.pushEnable,
              pullenable:scope.pullEnable,
              pushTriggerOffset:scope.pushTriggerOffset,
              pushStartHtml:scope.pushStartHtml,
              pushReleaseHtml:scope.pushReleaseHtml,
              pushLoadingHtml:scope.pushLoadingHtml,
              pullTriggerOffset:scope.pullTriggerOffset,
              pullStartHtml:scope.pullStartHtml,
              pullReleaseHtml:scope.pullReleaseHtml,
              pullLoadingHtml:scope.pullLoadingHtml,
              pullNothingHtml:scope.pullNothingHtml,
              startScrollY:scope.startScrollY
            });
            
            scope.tapped = function(el)
            {
              var el1 = el ;
              var dindex = -1 ;
              while( el1 != wrapper && el1 != null ) 
              { 
                if( typeof(el1.dindex) !== 'undefined' )
                {  dindex = el1.dindex ; break ; }
                else el1 = el1.parentNode ;
              }
              scope.delegate.onCellTapped(dindex) ;
            } ;
            
            // on scroller ready.
            scope.delegate.onScrollerReady.call(this,scope.scrollList) ;
          } ;// link function end.
      }// compile function end.
    } ;
}) ;