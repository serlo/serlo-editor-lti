export const wordEmbedJson = {
  detailsSnippet:
    '    <style>\n    body, html, div, h1, h2, h3 {\n    font-family: \'Open Sans\', Arial, sans-serif;\n}\n\n.edusharing_rendering_content_wrapper {\n    min-width: 250px;\n    line-height: 1.2;\n}\n\n.edusharing_rendering_content{\n    width: auto;\n}\n\nimg.edusharing_rendering_content{\n    max-width: 100%;\n}\n\n.edusharing_rendering_content_video_options_container {\n    display: flex;\n    flex-direction: column;\n    align-items: flex-end;\n    position: absolute;\n    top: 2%;\n    right: 2%;\n    color: #fff;\n    margin: 0;\n    text-align: right;\n}\n\n.edusharing_rendering_content_video_options_container_expanded {\n    background: rgba(0, 0, 0, 0.6);\n}\n\n.edusharing_rendering_content_video_options {\n    display: flex;\n    background: none;\n    border: none;\n    color: #fff;\n    padding: 5px;\n    cursor: pointer;\n}\n\n.edusharing_rendering_content_video_options:focus-visible {\n    outline: 2px solid white;\n    border-radius: 2px;\n}\n\n.edusharing_rendering_content_video_options i {\n    opacity: 0.8;\n}\n\n.edusharing_rendering_content_video_options_container_expanded\n.edusharing_rendering_content_video_options\ni,\n.edusharing_rendering_content_video_options:hover i,\n.edusharing_rendering_content_video_options:focus-visible i {\n    opacity: 1;\n}\n\ndiv.edusharing_rendering_content_video_options_content {\n    display: none;\n}\n\n.edusharing_rendering_content_video_options_container_expanded\n.edusharing_rendering_content_video_options_content {\n    display: block;\n}\n\ndiv.edusharing_rendering_content_video_wrapper {\n    display: inline-block;\n    position: relative;\n}\n\ndiv.edusharing_rendering_content_video_wrapper:hover\ndiv.edusharing_rendering_content_video_options {\n    display: block;\n}\n\nul.edusharing_rendering_content_video_options_resolutions {\n    padding: 0;\n    margin: 0;\n    font-size: 18px !important;\n}\n\nul.edusharing_rendering_content_video_options_resolutions i {\n    vertical-align: middle;\n    margin-right: 10px;\n    font-size: 18px !important;\n}\n\ni.edusharing_rendering_content_video_options_toggle {\n    text-shadow: 0px 0px 4px #333;\n}\n\nul.edusharing_rendering_content_video_options_resolutions > li {\n    cursor: pointer;\n    padding: 4px 10px;\n    list-style: none;\n}\n\nul.edusharing_rendering_content_video_options_resolutions > li:hover,\nul.edusharing_rendering_content_video_options_resolutions > li:focus-visible {\n    background-color: rgba(255, 255, 255, 0.2);\n}\n\nul.edusharing_rendering_content_video_options_resolutions > li:focus-visible {\n    outline: 2px solid white;\n    border-radius: 2px;\n}\n\nul.edusharing_rendering_content_video_options_resolutions\n> li.edusharing_rendering_content_video_options_resolutions_converting {\n    color: #999999;\n}\n\n\n\n\n.edusharing_warning {\n    display: inline-block;\n    background-color: #c6c6c6;\n    color: #383838;\n    padding: 5px;\n    border-radius: 3px;\n}\n\n.edusharing_rendering_content_footer {\n    width: 100%;\n    background: #f6f6f6;\n    padding: 6px;\n    box-sizing: border-box;\n}\n\n.edusharing_rendering_content_footer a, .edusharing_rendering_content_footer a:visited, .edusharing_rendering_content_footer a:focus, .edusharing_rendering_content_footer a:hover {\n    color: #4D799A;\n}\n\n.edusharing_rendering_content_footer_top {\n    overflow-y: hidden;\n    overflow-x: hidden;\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    min-height: 2rem;\n}\n\n.edusharing_rendering_content_footer_bot {\n}\n\n.edusharing_rendering_content_footer_sequence {\n    position: relative;\n\n}\n\n.edusharing_rendering_content_footer_directory {\n    width: 100%;\n    background: #f6f6f6;\n    padding: 12px;\n}\n\n.edusharing_rendering_content_footer_directory_header {\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n}\n\n.edusharing_rendering_content_footer_directory_header a {\n    color: #4D799A;\n}\n\n.edusharing_rendering_content_footer_directory_header a:hover {\n    text-decoration: none;\n}\n\n.edusharing_rendering_content_footer_directory_toggle > * {\n    margin-right: 20px;\n}\n\n.edusharing_rendering_content_footer_directory_creator {\n    display:block;\n    color: #999;\n    font-size: 90%;\n}\n\n.edusharing_rendering_content_footer_sequence .material-icons {\n    vertical-align: middle !important;\n}\n\n.edusharing_rendering_content_footer_directory .material-icons {\n    vertical-align: middle !important;\n}\n\n.edusharing_rendering_content_footer_sequence_toggle, .edusharing_rendering_content_footer_directory_toggle {\n    color: #4D799A;\n    cursor:pointer;\n    display: flex;\n    align-items: center;\n}\n\n.edusharing_rendering_content_footer_sequence_toggle {\n    margin-top: 6px;\n}\n\n.edusharing_rendering_content_footer_directory_toggle {\n    display: flex;\n    align-items: center;\n    width: 100%;\n}\n\n.edusharing_rendering_content_footer_sequence ul {\n    padding: 12px;\n    position: absolute;\n    z-index: 49;\n    background: #f6f6f6;\n    width: calc(100% + 12px);\n    margin-left: -6px;\n    box-sizing: border-box;\n}\n\n.edusharing_rendering_content_footer_directory ul {\n    margin: 10px 0 0 0;\n    background: #f6f6f6;\n    width: 100%;\n    padding: 0 !important;\n    box-sizing: border-box;\n}\n\n.edusharing_rendering_content_footer_sequence ul li, .edusharing_rendering_content_footer_directory ul li {\n    list-style: none;\n    height: 60px;\n    background: #fff;\n    font-size: 14px;\n    margin: 3px 0;\n    display: flex;\n    align-items: center;\n    width: 100%;\n    border-radius: 3px;\n}\n\n.edusharing_rendering_content_footer_sequence ul li a, .edusharing_rendering_content_footer_directory ul li a {\n    display: flex;\n    align-items: center;\n    color: #383838;\n    text-decoration: none;\n    width: 100%;\n}\n\n.edusharing_rendering_content_footer_sequence ul li a:hover, .edusharing_rendering_content_footer_directory ul li a:hover {\n    color: #383838;\n    text-decoration: none;\n}\n\n.edusharing_rendering_content_footer_sequence ul li img, .edusharing_rendering_content_footer_directory ul li img {\n    margin: 10px;\n}\n\n.edusharing_rendering_content_footer_sequence_showall {\n    margin-bottom: 0;\n    text-align: right;\n    display: inline-block;\n    width: 100%;\n    margin-top: 8px;\n}\n\n.edusharing_rendering_content_footer_top .license_permalink, .edusharing_rendering_content_footer_top .license {\n    text-align: left;\n    margin-right: 40px;\n}\n\nvideo, audio {\n    margin-bottom: -6px;\n    border: 0;\n}\n\n.dataProtectionRegulations, .dataProtectionRegulationsDialog {\n    background: #fff;\n    padding: 20px;\n    border-radius: 5px;\n    -webkit-box-shadow: 0px 2px 3px 0px rgba(0,0,0,0.3);\n    -moz-box-shadow: 0px 2px 3px 0px rgba(0,0,0,0.3);\n    box-shadow: 0px 2px 3px 0px rgba(0,0,0,0.3);\n    text-align: center;\n    background: #f6f6f6;\n    margin: auto;\n    border: 0;\n}\n\n.dataProtectionRegulationsHeading {\n    font-size: 1.8em;\n}\n\na.edusharing_rendering_content {\n    margin-top: 20px;\n    margin-left: 10px;\n    margin-right: 10px;\n}\n\na.edusharing_rendering_content {\n    border-radius: 3px;\n    padding: 8px 16px;\n    text-decoration: none;\n    color: #fff;\n    background-color: #4F7A98;\n    display: inline-block;\n    margin: 20px;\n    font-weight: 600;\n}\n\n.edusharing_rendering_wrapper {\n    text-align: center;\n}\n</style>\n<div class="edusharing_rendering_wrapper" vocab="http://schema.org/" typeof="WebPage">\n    <div class="edusharing_rendering_content_wrapper" role="main">\n        <img class="edusharing_rendering_content_preview" style="max-width: 100%; height: auto;" src="https://repository.staging.cloud.schulcampus-rlp.de/edu-sharing/preview?nodeId=4473dae1-c7c7-4eec-a9bf-392b5fa59090&storeProtocol=workspace&storeId=SpacesStore&dontcache=1736785869981" alt="" width="0" height="0">\n        <a href="https://rendering.services.staging.cloud.schulcampus-rlp.de:443/esrender/modules/cache/doc/2024/11/08/08/23/31/4473dae1-c7c7-4eec-a9bf-392b5fa59090_1.1?ESSID=p3q8070c4flj50j11cc1c8qpvb&token=a5a5308589df636c45b00bbeb4af8c10" target="_blank" class="edusharing_rendering_content" id="edusharing_rendering_content_href">Herunterladen</a>    </div>\n    <div class="edusharing_rendering_content_footer">\n    <div class="edusharing_rendering_content_footer_top">\n        <a class="license_permalink" href="{{{LMS_INLINE_HELPER_SCRIPT}}}&closeOnBack=true" target="_blank" title="Lars 4328.docx"><es:title xmlns:es="http://edu-sharing.net/object" >Lars 4328.docx</es:title></a>            </div>\n    <div class="edusharing_rendering_content_footer_bot">\n            </div>\n</div>\n</div>\n',
  mimeType:
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  node: {
    nodeLTIDeepLink: null,
    remote: null,
    content: {
      url: 'https://repository.staging.cloud.schulcampus-rlp.de/edu-sharing/components/render/4473dae1-c7c7-4eec-a9bf-392b5fa59090',
      hash: '532151807',
      version: '1.1',
    },
    license: {
      icon: 'https://repository.staging.cloud.schulcampus-rlp.de/edu-sharing/ccimages/licenses/none.svg',
      url: null,
    },
    isDirectory: false,
    commentCount: 0,
    rating: null,
    usedInCollections: [],
    relations: null,
    contributors: [
      {
        property: 'ccm:metadatacontributer_creator',
        firstname: 'serlo-editor',
        lastname: 'serlo-editor',
        email: 'VCARD_EMAIL',
        vcard:
          'BEGIN:VCARD\nVERSION:3.0\nUID:urn:uuid:17effc0d-ad65-47ca-8777-d74cde4a74e5\nN:serlo-editor;serlo-editor\nFN:serlo-editor serlo-editor\nORG:\nURL:\nTITLE:\nTEL;TYPE=WORK,VOICE:\nADR;TYPE=intl,postal,parcel,work:;;;;;;\nEMAIL;TYPE=PREF,INTERNET:serlo-editor\nEND:VCARD\n',
        org: '',
      },
    ],
    ref: {
      repo: 'local',
      id: '4473dae1-c7c7-4eec-a9bf-392b5fa59090',
      archived: false,
      isHomeRepo: true,
    },
    parent: {
      repo: 'local',
      id: 'd8f59ccb-f924-4ed8-b581-e3063dd5b9bb',
      archived: false,
      isHomeRepo: true,
    },
    type: 'ccm:io',
    aspects: [
      'cclom:lifecycle',
      'cclom:technical',
      'ccm:eduscope',
      'ccm:iometadata',
      'cm:versionable',
      'ccm:tracking',
      'ccm:usageaspect',
      'sys:referenceable',
      'sys:localized',
      'cm:thumbnailModification',
      'cclom:schema',
      'cm:metadataset',
      'ccm:licenses',
      'ccm:commonlicenses',
      'cclom:rights',
      'cm:thumbnailed',
      'cm:titled',
      'cclom:meta-metadata',
      'cm:auditable',
      'ccm:lomreplication',
      'cclom:general',
      'cm:author',
      'ccm:educontext',
    ],
    name: 'Lars 4328.docx',
    title: null,
    metadataset: 'mds',
    repositoryType: 'ALFRESCO',
    createdAt: '2024-11-08T08:22:49Z',
    createdBy: {
      profile: null,
      firstName: 'serlo-editor',
      lastName: 'serlo-editor',
      mailbox: 'serlo-editor',
    },
    modifiedAt: '2024-11-08T08:23:20Z',
    modifiedBy: {
      profile: null,
      firstName: 'serlo-editor',
      lastName: 'serlo-editor',
      mailbox: 'serlo-editor',
    },
    access: ['Read', 'ReadAll', 'Feedback'],
    downloadUrl:
      'https://repository.staging.cloud.schulcampus-rlp.de/edu-sharing/eduservlet/download?nodeId=4473dae1-c7c7-4eec-a9bf-392b5fa59090',
    properties: {
      'ccm:original': ['4473dae1-c7c7-4eec-a9bf-392b5fa59090'],
      'cm:created': ['8. November 2024, 09:22'],
      'virtual:commentcount': ['0'],
      'ccm:metadatacontributer_creatorVCARD_ORG': [''],
      'cclom:size': ['25163'],
      'cclom:version': ['1.1'],
      'ccm:tracking_views': ['85'],
      'virtual:usagecount': ['6'],
      'sys:node-uuid': ['4473dae1-c7c7-4eec-a9bf-392b5fa59090'],
      'virtual:childobjectcount': ['0'],
      'virtual:mediatype': ['Word-Dokument'],
      'sys:store-protocol': ['workspace'],
      'sys:store-identifier': ['SpacesStore'],
      'ccm:version_comment': ['EDITOR_UPLOAD,ONLY_OFFICE'],
      'cclom:format': [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      'ccm:metadatacontributer_creatorVCARD_URL': [''],
      'ccm:create_version': ['true'],
      'cm:modifiedISO8601': ['2024-11-08T08:23:20.693Z'],
      'ccm:metadatacontributer_creatorVCARD_REGION': [''],
      'sys:node-dbid': ['54599864'],
      'cm:edu_metadataset': ['mds'],
      'ccm:metadatacontributer_creatorVCARD_PLZ': [''],
      'cm:creator': ['serlo-editor'],
      'cm:autoVersion': ['false'],
      'virtual:permalink': [
        'https://repository.staging.cloud.schulcampus-rlp.de/edu-sharing/components/render/4473dae1-c7c7-4eec-a9bf-392b5fa59090/1.1',
      ],
      'ccm:metadatacontributer_creatorVCARD_GIVENNAME': ['serlo-editor'],
      'cm:versionLabel': ['1.1'],
      'ccm:search_context': ['campus_content'],
      'cm:versionable': ['true'],
      'ccm:metadatacontributer_creatorVCARD_COUNTRY': [''],
      'cm:created_LONG': ['1731054169174'],
      'virtual:primaryparent_nodeid': ['d8f59ccb-f924-4ed8-b581-e3063dd5b9bb'],
      'cm:lastThumbnailModification': ['imgpreview:1731054210368'],
      'ccm:metadatacontributer_creator': [
        'BEGIN:VCARD\nVERSION:3.0\nUID:urn:uuid:17effc0d-ad65-47ca-8777-d74cde4a74e5\nN:serlo-editor;serlo-editor\nFN:serlo-editor serlo-editor\nORG:\nURL:\nTITLE:\nTEL;TYPE&#61;WORK,VOICE:\nADR;TYPE&#61;intl,postal,parcel,work:;;;;;;\nEMAIL;TYPE&#61;PREF,INTERNET:serlo-editor\nEND:VCARD\n',
      ],
      'ccm:metadatacontributer_creatorVCARD_TEL': [''],
      'ccm:metadatacontributer_creatorVCARD_STREET': [''],
      'cm:createdISO8601': ['2024-11-08T08:22:49.174Z'],
      'cm:modified': ['8. November 2024, 09:23'],
      'cm:edu_forcemetadataset': ['false'],
      'ccm:metadatacontributer_creatorVCARD_CITY': [''],
      'cm:modifier': ['serlo-editor'],
      'cm:autoVersionOnUpdateProps': ['false'],
      'cclom:location': ['ccrep://local/4473dae1-c7c7-4eec-a9bf-392b5fa59090'],
      'ccm:educontextname': ['default'],
      'ccm:metadatacontributer_creatorVCARD_EMAIL': ['serlo-editor'],
      'ccm:metadatacontributer_creatorFN': ['serlo-editor serlo-editor'],
      'cm:modified_LONG': ['1731054200693'],
      'ccm:metadatacontributer_creatorVCARD_TITLE': [''],
      'cm:automaticUpdate': ['true'],
      'cm:name': ['Lars 4328.docx'],
      'virtual:type': ['ccm:io'],
      'ccm:tracking_downloads': ['1'],
      'ccm:search_context_DISPLAYNAME': ['Campus Inhalt'],
      'cm:initialVersion': ['false'],
      'ccm:metadatacontributer_creatorVCARD_SURNAME': ['serlo-editor'],
    },
    mimetype:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    mediatype: 'file-word',
    size: '25163',
    preview: {
      isIcon: false,
      isGenerated: true,
      type: 'TYPE_GENERATED',
      mimetype: null,
      data: null,
      url: 'https://repository.staging.cloud.schulcampus-rlp.de/edu-sharing/preview?nodeId=4473dae1-c7c7-4eec-a9bf-392b5fa59090&storeProtocol=workspace&storeId=SpacesStore&dontcache=1736785869981',
      width: null,
      height: null,
    },
    iconURL:
      'https://repository.staging.cloud.schulcampus-rlp.de/edu-sharing/themes/default/images/common/mime-types/svg/file-word.svg',
    collection: null,
    owner: {
      profile: null,
      firstName: 'serlo-editor',
      lastName: 'serlo-editor',
      mailbox: 'serlo-editor',
    },
    isPublic: false,
  },
}
