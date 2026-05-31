// 训练数据
const SQL_TRAINING_DATA = [
            {id:266,batch_no:1,epoch:46,time:432.128,box_loss:3.45263,seg_loss:5.83228,cls_loss:5.28194,dfl_loss:4.31722,box_precision:0.1099,box_recall:0.05,box_map50:0.03251,box_map95:0.00763,m_precision:0.00021,m_recall:0.05,m_map50:0.00071,m_map95:7e-05,v_box_loss:3.32282,v_seg_loss:5.89354,v_cls_loss:5.15166,v_dfl_loss:4.30007,lr_pg0:0.0014241,lr_pg1:0.0004747,lr_pg2:0.0014241,updated_at:"2026-01-27 05:42:06.682835+00",plan_id:4},
            {id:267,batch_no:1,epoch:47,time:496.624,box_loss:3.56511,seg_loss:5.76989,cls_loss:5.07964,dfl_loss:4.30628,box_precision:0.03532,box_recall:0.2,box_map50:0.0244,box_map95:0.00728,m_precision:0.00083,m_recall:0.2,m_map50:0.00215,m_map95:0.00022,v_box_loss:3.35162,v_seg_loss:5.63507,v_cls_loss:5.29905,v_dfl_loss:4.32976,lr_pg0:0.0013398,lr_pg1:0.0004466,lr_pg2:0.0013398,updated_at:"2026-01-27 05:42:06.682843+00",plan_id:4},
            {id:268,batch_no:1,epoch:48,time:562.702,box_loss:3.35196,seg_loss:5.6396,cls_loss:5.26159,dfl_loss:4.34548,box_precision:0.00474,box_recall:0.45,box_map50:0.02028,box_map95:0.00515,m_precision:0.00042,m_recall:0.1,m_map50:0.00038,m_map95:4e-05,v_box_loss:3.28427,v_seg_loss:5.43579,v_cls_loss:4.96475,v_dfl_loss:4.39609,lr_pg0:0.00116046,lr_pg1:0.00038682,lr_pg2:0.00116046,updated_at:"2026-01-27 05:42:06.682854+00",plan_id:4},
            {id:269,batch_no:1,epoch:49,time:629.634,box_loss:3.51156,seg_loss:5.46112,cls_loss:4.9932,dfl_loss:4.31394,box_precision:0.18632,box_recall:0.1,box_map50:0.04425,box_map95:0.00565,m_precision:0.00042,m_recall:0.1,m_map50:0.00185,m_map95:0.0002,v_box_loss:3.31527,v_seg_loss:5.31122,v_cls_loss:5.01847,v_dfl_loss:4.31431,lr_pg0:0.00088608,lr_pg1:0.00029536,lr_pg2:0.00088608,updated_at:"2026-01-27 05:42:06.682869+00",plan_id:4},
            {id:270,batch_no:1,epoch:50,time:694.759,box_loss:3.62323,seg_loss:5.42627,cls_loss:5.14281,dfl_loss:4.35136,box_precision:0.1644,box_recall:0.1,box_map50:0.05276,box_map95:0.00784,m_precision:0.00063,m_recall:0.15,m_map50:0.00119,m_map95:0.00016,v_box_loss:3.3485,v_seg_loss:5.23209,v_cls_loss:4.96814,v_dfl_loss:4.3012,lr_pg0:0.00051666,lr_pg1:0.00017222,lr_pg2:0.00051666,updated_at:"2026-01-27 05:42:06.682878+00",plan_id:4},
            {id:271,batch_no:1,epoch:51,time:82.5203,box_loss:3.44209,seg_loss:6.34923,cls_loss:5.31028,dfl_loss:4.36331,box_precision:0.30957,box_recall:0.09109,box_map50:0.07534,box_map95:0.01474,m_precision:0.00042,m_recall:0.1,m_map50:0.00219,m_map95:0.00022,v_box_loss:3.22326,v_seg_loss:6.05062,v_cls_loss:5.09846,v_dfl_loss:4.33207,lr_pg0:0.00042,lr_pg1:0.00014,lr_pg2:0.00042,updated_at:"2026-01-27 05:53:54.851909+00",plan_id:4},
            {id:272,batch_no:1,epoch:52,time:160.461,box_loss:3.58327,seg_loss:5.87319,cls_loss:5.35136,dfl_loss:4.305,box_precision:0.00466,box_recall:0.4,box_map50:0.01842,box_map95:0.00352,m_precision:0.00021,m_recall:0.05,m_map50:0.00013,m_map95:1e-05,v_box_loss:3.26686,v_seg_loss:5.68622,v_cls_loss:5.07909,v_dfl_loss:4.34662,lr_pg0:0.0008109,lr_pg1:0.0002703,lr_pg2:0.0008109,updated_at:"2026-01-27 05:53:54.851948+00",plan_id:4},
            {id:273,batch_no:1,epoch:53,time:231.073,box_loss:3.55754,seg_loss:5.62981,cls_loss:5.38971,dfl_loss:4.31011,box_precision:0.19667,box_recall:0.07511,box_map50:0.07287,box_map95:0.00796,m_precision:0.00063,m_recall:0.15,m_map50:0.00077,m_map95:9e-05,v_box_loss:3.28785,v_seg_loss:5.79891,v_cls_loss:4.96616,v_dfl_loss:4.3419,lr_pg0:0.00110676,lr_pg1:0.00036892,lr_pg2:0.00110676,updated_at:"2026-01-27 05:53:54.85196+00",plan_id:4},
            {id:274,batch_no:1,epoch:54,time:298.834,box_loss:3.55055,seg_loss:5.70827,cls_loss:5.29844,dfl_loss:4.30605,box_precision:0.54594,box_recall:0.05,box_map50:0.05472,box_map95:0.0063,m_precision:0.00042,m_recall:0.1,m_map50:0.00097,m_map95:0.0001,v_box_loss:3.26422,v_seg_loss:5.87829,v_cls_loss:5.05626,v_dfl_loss:4.32046,lr_pg0:0.00130758,lr_pg1:0.00043586,lr_pg2:0.00130758,updated_at:"2026-01-27 05:53:54.851972+00",plan_id:4},
            {id:275,batch_no:1,epoch:55,time:368.651,box_loss:3.47973,seg_loss:5.55487,cls_loss:5.03694,dfl_loss:4.30963,box_precision:0.01573,box_recall:0.3,box_map50:0.01353,box_map95:0.00273,m_precision:0.00108,m_recall:0.1,m_map50:0.00423,m_map95:0.00044,v_box_loss:3.27619,v_seg_loss:5.41203,v_cls_loss:5.07925,v_dfl_loss:4.35815,lr_pg0:0.00141336,lr_pg1:0.00047112,lr_pg2:0.00141336,updated_at:"2026-01-27 05:53:54.851983+00",plan_id:4},
            {id:276,batch_no:1,epoch:56,time:438.016,box_loss:3.4228,seg_loss:5.42594,cls_loss:5.06627,dfl_loss:4.28843,box_precision:0.00449,box_recall:0.35,box_map50:0.02526,box_map95:0.00332,m_precision:0.00108,m_recall:0.25,m_map50:0.00543,m_map95:0.0006,v_box_loss:3.28844,v_seg_loss:5.22957,v_cls_loss:4.97333,v_dfl_loss:4.28672,lr_pg0:0.0014241,lr_pg1:0.0004747,lr_pg2:0.0014241,updated_at:"2026-01-27 05:53:54.851992+00",plan_id:4},
            {id:277,batch_no:1,epoch:57,time:505.054,box_loss:3.57223,seg_loss:5.44465,cls_loss:4.95559,dfl_loss:4.27093,box_precision:0.20447,box_recall:0.05,box_map50:0.03167,box_map95:0.00397,m_precision:0.00104,m_recall:0.25,m_map50:0.00777,m_map95:0.00082,v_box_loss:3.3663,v_seg_loss:5.22897,v_cls_loss:5.12158,v_dfl_loss:4.26268,lr_pg0:0.0013398,lr_pg1:0.0004466,lr_pg2:0.0013398,updated_at:"2026-01-27 05:53:54.852002+00",plan_id:4},
            {id:278,batch_no:1,epoch:58,time:572.491,box_loss:3.36297,seg_loss:5.27964,cls_loss:5.10685,dfl_loss:4.30384,box_precision:0.16018,box_recall:0.15,box_map50:0.05655,box_map95:0.00793,m_precision:0.00262,m_recall:0.2,m_map50:0.00849,m_map95:0.00091,v_box_loss:3.29762,v_seg_loss:5.17531,v_cls_loss:5.03279,v_dfl_loss:4.27757,lr_pg0:0.00116046,lr_pg1:0.00038682,lr_pg2:0.00116046,updated_at:"2026-01-27 05:53:54.852012+00",plan_id:4},
            {id:279,batch_no:1,epoch:59,time:637.975,box_loss:3.52605,seg_loss:5.21283,cls_loss:5.00817,dfl_loss:4.29133,box_precision:0.09597,box_recall:0.15,box_map50:0.0431,box_map95:0.00679,m_precision:0.00109,m_recall:0.25,m_map50:0.00711,m_map95:0.00075,v_box_loss:3.31005,v_seg_loss:5.08205,v_cls_loss:4.95271,v_dfl_loss:4.27923,lr_pg0:0.00088608,lr_pg1:0.00029536,lr_pg2:0.00088608,updated_at:"2026-01-27 05:53:54.852027+00",plan_id:4},
            {id:280,batch_no:1,epoch:60,time:701.231,box_loss:3.60451,seg_loss:5.13412,cls_loss:5.04055,dfl_loss:4.28996,box_precision:0.07481,box_recall:0.1,box_map50:0.02626,box_map95:0.00474,m_precision:0.00766,m_recall:0.25,m_map50:0.00741,m_map95:0.0009,v_box_loss:3.26273,v_seg_loss:5.04025,v_cls_loss:4.97322,v_dfl_loss:4.22238,lr_pg0:0.00051666,lr_pg1:0.00017222,lr_pg2:0.00051666,updated_at:"2026-01-27 05:53:54.852036+00",plan_id:4},
            {id:281,batch_no:1,epoch:61,time:82.2987,box_loss:3.41634,seg_loss:6.08616,cls_loss:5.34987,dfl_loss:4.32049,box_precision:0.34067,box_recall:0.10385,box_map50:0.13102,box_map95:0.02225,m_precision:0.00063,m_recall:0.15,m_map50:0.00038,m_map95:4e-05,v_box_loss:3.25703,v_seg_loss:5.88879,v_cls_loss:5.23562,v_dfl_loss:4.30907,lr_pg0:0.00042,lr_pg1:0.00014,lr_pg2:0.00042,updated_at:"2026-01-27 06:05:25.511314+00",plan_id:4},
            {id:282,batch_no:1,epoch:62,time:158.413,box_loss:3.54713,seg_loss:5.88276,cls_loss:5.34068,dfl_loss:4.30226,box_precision:0.77657,box_recall:0.05,box_map50:0.06055,box_map95:0.0217,m_precision:0.77657,m_recall:0.05,m_map50:0.04542,m_map95:0.00454,v_box_loss:3.22177,v_seg_loss:5.77844,v_cls_loss:5.25932,v_dfl_loss:4.33079,lr_pg0:0.0008109,lr_pg1:0.0002703,lr_pg2:0.0008109,updated_at:"2026-01-27 06:05:25.51136+00",plan_id:4},
            {id:283,batch_no:1,epoch:63,time:226.181,box_loss:3.53675,seg_loss:5.57451,cls_loss:5.2052,dfl_loss:4.31828,box_precision:0.80168,box_recall:0.05,box_map50:0.06889,box_map95:0.02275,m_precision:0.80168,m_recall:0.05,m_map50:0.04542,m_map95:0.00905,v_box_loss:3.30363,v_seg_loss:5.59829,v_cls_loss:5.2887,v_dfl_loss:4.32595,lr_pg0:0.00110676,lr_pg1:0.00036892,lr_pg2:0.00110676,updated_at:"2026-01-27 06:05:25.511373+00",plan_id:4},
            {id:284,batch_no:1,epoch:64,time:292.587,box_loss:3.5416,seg_loss:5.66404,cls_loss:5.37123,dfl_loss:4.2598,box_precision:0.88033,box_recall:0.1,box_map50:0.10811,box_map95:0.02499,m_precision:0.43278,m_recall:0.05,m_map50:0.02321,m_map95:0.00458,v_box_loss:3.34026,v_seg_loss:5.41906,v_cls_loss:5.07971,v_dfl_loss:4.3124,lr_pg0:0.00130758,lr_pg1:0.00043586,lr_pg2:0.00130758,updated_at:"2026-01-27 06:05:25.511383+00",plan_id:4},
            {id:285,batch_no:1,epoch:65,time:359.944,box_loss:3.46116,seg_loss:5.50978,cls_loss:5.07405,dfl_loss:4.31943,box_precision:0.36395,box_recall:0.05,box_map50:0.04343,box_map95:0.00781,m_precision:0.00574,m_recall:0.1,m_map50:0.00387,m_map95:0.00056,v_box_loss:3.24948,v_seg_loss:5.23816,v_cls_loss:4.96147,v_dfl_loss:4.32166,lr_pg0:0.00141336,lr_pg1:0.00047112,lr_pg2:0.00141336,updated_at:"2026-01-27 06:05:25.511394+00",plan_id:4},
            {id:286,batch_no:1,epoch:66,time:426.709,box_loss:3.45753,seg_loss:5.34269,cls_loss:5.21509,dfl_loss:4.25834,box_precision:0.1188,box_recall:0.1,box_map50:0.04537,box_map95:0.00944,m_precision:0.22711,m_recall:0.1,m_map50:0.04955,m_map95:0.00497,v_box_loss:3.2831,v_seg_loss:5.34584,v_cls_loss:5.03768,v_dfl_loss:4.30172,lr_pg0:0.0014241,lr_pg1:0.0004747,lr_pg2:0.0014241,updated_at:"2026-01-27 06:05:25.511403+00",plan_id:4},
            {id:287,batch_no:1,epoch:67,time:490.422,box_loss:3.55636,seg_loss:5.39114,cls_loss:4.97786,dfl_loss:4.26064,box_precision:0.15602,box_recall:0.148,box_map50:0.04257,box_map95:0.01024,m_precision:0.13966,m_recall:0.05,m_map50:0.01825,m_map95:0.00182,v_box_loss:3.2721,v_seg_loss:5.16764,v_cls_loss:4.86934,v_dfl_loss:4.30708,lr_pg0:0.0013398,lr_pg1:0.0004466,lr_pg2:0.0013398,updated_at:"2026-01-27 06:05:25.511411+00",plan_id:4},
            {id:288,batch_no:1,epoch:68,time:555.489,box_loss:3.35406,seg_loss:5.28005,cls_loss:5.13056,dfl_loss:4.29529,box_precision:0.07356,box_recall:0.35,box_map50:0.05561,box_map95:0.00847,m_precision:0.15408,m_recall:0.05,m_map50:0.02213,m_map95:0.00256,v_box_loss:3.27865,v_seg_loss:5.00633,v_cls_loss:4.95813,v_dfl_loss:4.25902,lr_pg0:0.00116046,lr_pg1:0.00038682,lr_pg2:0.00116046,updated_at:"2026-01-27 06:05:25.511421+00",plan_id:4},
            {id:289,batch_no:1,epoch:69,time:619.549,box_loss:3.49145,seg_loss:5.22158,cls_loss:5.03375,dfl_loss:4.27577,box_precision:0.14089,box_recall:0.10697,box_map50:0.04343,box_map95:0.01113,m_precision:0.24116,m_recall:0.1,m_map50:0.0435,m_map95:0.00685,v_box_loss:3.19949,v_seg_loss:5.07262,v_cls_loss:4.95861,v_dfl_loss:4.25588,lr_pg0:0.00088608,lr_pg1:0.00029536,lr_pg2:0.00088608,updated_at:"2026-01-27 06:05:25.511435+00",plan_id:4},
            {id:290,batch_no:1,epoch:70,time:681.175,box_loss:3.58004,seg_loss:5.13808,cls_loss:5.05178,dfl_loss:4.28294,box_precision:0.05742,box_recall:0.05,box_map50:0.02845,box_map95:0.00808,m_precision:0.11659,m_recall:0.1,m_map50:0.04853,m_map95:0.00488,v_box_loss:3.25647,v_seg_loss:4.97579,v_cls_loss:4.89693,v_dfl_loss:4.24911,lr_pg0:0.00051666,lr_pg1:0.00017222,lr_pg2:0.00051666,updated_at:"2026-01-27 06:05:25.511444+00",plan_id:4},
            {id:291,batch_no:1,epoch:71,time:83.3752,box_loss:3.4047,seg_loss:5.81658,cls_loss:5.32048,dfl_loss:4.30132,box_precision:0.17566,box_recall:0.05,box_map50:0.04706,box_map95:0.01486,m_precision:0.20865,m_recall:0.05,m_map50:0.02276,m_map95:0.00454,v_box_loss:3.28048,v_seg_loss:5.57617,v_cls_loss:5.13457,v_dfl_loss:4.32478,lr_pg0:0.00042,lr_pg1:0.00014,lr_pg2:0.00042,updated_at:"2026-01-27 06:17:10.280763+00",plan_id:4},
            {id:292,batch_no:1,epoch:72,time:160.418,box_loss:3.55061,seg_loss:5.51977,cls_loss:5.29556,dfl_loss:4.2633,box_precision:0.05644,box_recall:0.1,box_map50:0.02756,box_map95:0.00687,m_precision:0.00391,m_recall:0.05,m_map50:0.00473,m_map95:0.00047,v_box_loss:3.29216,v_seg_loss:5.49063,v_cls_loss:5.01493,v_dfl_loss:4.25577,lr_pg0:0.0008109,lr_pg1:0.0002703,lr_pg2:0.0008109,updated_at:"2026-01-27 06:17:10.280802+00",plan_id:4},
            {id:293,batch_no:1,epoch:73,time:229.808,box_loss:3.54868,seg_loss:5.3681,cls_loss:5.32449,dfl_loss:4.24999,box_precision:0.02115,box_recall:0.25,box_map50:0.01755,box_map95:0.00327,m_precision:0.00042,m_recall:0.1,m_map50:0.00027,m_map95:3e-05,v_box_loss:3.30967,v_seg_loss:5.57957,v_cls_loss:4.98669,v_dfl_loss:4.24518,lr_pg0:0.00110676,lr_pg1:0.00036892,lr_pg2:0.00110676,updated_at:"2026-01-27 06:17:10.280814+00",plan_id:4},
            {id:294,batch_no:1,epoch:74,time:298.105,box_loss:3.56386,seg_loss:5.53223,cls_loss:5.28977,dfl_loss:4.25671,box_precision:0.07547,box_recall:0.05,box_map50:0.04234,box_map95:0.00658,m_precision:0.00083,m_recall:0.2,m_map50:0.003,m_map95:0.0003,v_box_loss:3.23378,v_seg_loss:5.36047,v_cls_loss:4.90773,v_dfl_loss:4.30958,lr_pg0:0.00130758,lr_pg1:0.00043586,lr_pg2:0.00130758,updated_at:"2026-01-27 06:17:10.280825+00",plan_id:4},
            {id:295,batch_no:1,epoch:75,time:365.974,box_loss:3.43443,seg_loss:5.39138,cls_loss:4.98383,dfl_loss:4.29084,box_precision:0.05523,box_recall:0.35,box_map50:0.0501,box_map95:0.00885,m_precision:0.01578,m_recall:0.1,m_map50:0.00465,m_map95:0.00048,v_box_loss:3.27253,v_seg_loss:5.10806,v_cls_loss:5.06482,v_dfl_loss:4.23861,lr_pg0:0.00141336,lr_pg1:0.00047112,lr_pg2:0.00141336,updated_at:"2026-01-27 06:17:10.280835+00",plan_id:4},
            {id:296,batch_no:1,epoch:76,time:432.166,box_loss:3.43165,seg_loss:5.3011,cls_loss:5.17434,dfl_loss:4.23452,box_precision:0.11616,box_recall:0.1,box_map50:0.04392,box_map95:0.00953,m_precision:0.05808,m_recall:0.05,m_map50:0.01852,m_map95:0.00339,v_box_loss:3.33943,v_seg_loss:5.01876,v_cls_loss:4.89239,v_dfl_loss:4.26915,lr_pg0:0.0014241,lr_pg1:0.0004747,lr_pg2:0.0014241,updated_at:"2026-01-27 06:17:10.280843+00",plan_id:4},
            {id:297,batch_no:1,epoch:77,time:495.872,box_loss:3.52887,seg_loss:5.25511,cls_loss:4.99373,dfl_loss:4.26009,box_precision:0.08386,box_recall:0.05,box_map50:0.03135,box_map95:0.00553,m_precision:0.00774,m_recall:0.2,m_map50:0.0058,m_map95:0.00075,v_box_loss:3.31101,v_seg_loss:4.85083,v_cls_loss:4.7778,v_dfl_loss:4.26175,lr_pg0:0.0013398,lr_pg1:0.0004466,lr_pg2:0.0013398,updated_at:"2026-01-27 06:17:10.280852+00",plan_id:4},
            {id:298,batch_no:1,epoch:78,time:561.119,box_loss:3.31904,seg_loss:5.17975,cls_loss:5.08958,dfl_loss:4.30938,box_precision:0.14642,box_recall:0.05,box_map50:0.05407,box_map95:0.00942,m_precision:0.07141,m_recall:0.1,m_map50:0.01876,m_map95:0.00199,v_box_loss:3.32445,v_seg_loss:4.89207,v_cls_loss:4.87802,v_dfl_loss:4.24043,lr_pg0:0.00116046,lr_pg1:0.00038682,lr_pg2:0.00116046,updated_at:"2026-01-27 06:17:10.280862+00",plan_id:4},
            {id:299,batch_no:1,epoch:79,time:628.435,box_loss:3.51535,seg_loss:5.14411,cls_loss:4.95,dfl_loss:4.26093,box_precision:0.20602,box_recall:0.1,box_map50:0.06445,box_map95:0.0139,m_precision:0.13268,m_recall:0.1,m_map50:0.03723,m_map95:0.00457,v_box_loss:3.33308,v_seg_loss:4.93303,v_cls_loss:4.91469,v_dfl_loss:4.26084,lr_pg0:0.00088608,lr_pg1:0.00029536,lr_pg2:0.00088608,updated_at:"2026-01-27 06:17:10.280875+00",plan_id:4},
            {id:300,batch_no:1,epoch:80,time:692.696,box_loss:3.63963,seg_loss:5.0123,cls_loss:4.99718,dfl_loss:4.28937,box_precision:0.2044,box_recall:0.12943,box_map50:0.09647,box_map95:0.02165,m_precision:0.06914,m_recall:0.05,m_map50:0.02166,m_map95:0.00247,v_box_loss:3.36778,v_seg_loss:4.89119,v_cls_loss:4.90984,v_dfl_loss:4.25069,lr_pg0:0.00051666,lr_pg1:0.00017222,lr_pg2:0.00051666,updated_at:"2026-01-27 06:17:10.280884+00",plan_id:4},
            {id:311,batch_no:1,epoch:81,time:81.4242,box_loss:3.43079,seg_loss:5.26967,cls_loss:5.18058,dfl_loss:4.25406,box_precision:0.27877,box_recall:0.1,box_map50:0.06611,box_map95:0.01735,m_precision:0.19847,m_recall:0.05,m_map50:0.02005,m_map95:0.00234,v_box_loss:3.36309,v_seg_loss:4.80822,v_cls_loss:4.8626,v_dfl_loss:4.24006,lr_pg0:0.00042,lr_pg1:0.00014,lr_pg2:0.00042,updated_at:"2026-01-27 06:30:17.657687+00",plan_id:4},
            {id:312,batch_no:1,epoch:82,time:158.365,box_loss:3.55202,seg_loss:5.19234,cls_loss:5.12233,dfl_loss:4.22073,box_precision:0.46646,box_recall:0.1,box_map50:0.1049,box_map95:0.03951,m_precision:0.14071,m_recall:0.05,m_map50:0.06609,m_map95:0.01571,v_box_loss:3.40397,v_seg_loss:4.69768,v_cls_loss:4.89293,v_dfl_loss:4.25226,lr_pg0:0.0008109,lr_pg1:0.0002703,lr_pg2:0.0008109,updated_at:"2026-01-27 06:30:17.657727+00",plan_id:4},
            {id:313,batch_no:1,epoch:83,time:226.699,box_loss:3.5541,seg_loss:4.98571,cls_loss:5.14777,dfl_loss:4.20832,box_precision:0.2887,box_recall:0.1,box_map50:0.05147,box_map95:0.00979,m_precision:0.04716,m_recall:0.05,m_map50:0.01237,m_map95:0.00225,v_box_loss:3.29572,v_seg_loss:4.74431,v_cls_loss:4.72819,v_dfl_loss:4.24518,lr_pg0:0.00110676,lr_pg1:0.00036892,lr_pg2:0.00110676,updated_at:"2026-01-27 06:30:17.657739+00",plan_id:4},
            {id:314,batch_no:1,epoch:84,time:294.329,box_loss:3.56303,seg_loss:5.10313,cls_loss:5.09259,dfl_loss:4.22649,box_precision:0.32526,box_recall:0.05,box_map50:0.07256,box_map95:0.00916,m_precision:0.0195,m_recall:0.05,m_map50:0.01631,m_map95:0.00184,v_box_loss:3.27626,v_seg_loss:4.69271,v_cls_loss:4.76717,v_dfl_loss:4.23293,lr_pg0:0.00130758,lr_pg1:0.00043586,lr_pg2:0.00130758,updated_at:"2026-01-27 06:30:17.657751+00",plan_id:4},
            {id:315,batch_no:1,epoch:85,time:362.244,box_loss:3.4679,seg_loss:4.96739,cls_loss:4.92664,dfl_loss:4.21418,box_precision:0.02506,box_recall:0.1,box_map50:0.01993,box_map95:0.00395,m_precision:0.00208,m_recall:0.5,m_map50:0.01105,m_map95:0.00143,v_box_loss:3.30842,v_seg_loss:4.60872,v_cls_loss:4.7756,v_dfl_loss:4.22692,lr_pg0:0.00141336,lr_pg1:0.00047112,lr_pg2:0.00141336,updated_at:"2026-01-27 06:30:17.657761+00",plan_id:4},
            {id:316,batch_no:1,epoch:86,time:430.109,box_loss:3.46637,seg_loss:4.84596,cls_loss:4.98075,dfl_loss:4.17508,box_precision:0.00596,box_recall:0.4,box_map50:0.03763,box_map95:0.00708,m_precision:0.12007,m_recall:0.25,m_map50:0.07364,m_map95:0.00915,v_box_loss:3.26364,v_seg_loss:4.40586,v_cls_loss:4.88324,v_dfl_loss:4.18635,lr_pg0:0.0014241,lr_pg1:0.0004747,lr_pg2:0.0014241,updated_at:"2026-01-27 06:30:17.65777+00",plan_id:4},
            {id:317,batch_no:1,epoch:87,time:496.446,box_loss:3.52536,seg_loss:4.89473,cls_loss:4.7894,dfl_loss:4.1953,box_precision:0.03952,box_recall:0.2,box_map50:0.0349,box_map95:0.00706,m_precision:0.16278,m_recall:0.1,m_map50:0.069,m_map95:0.00881,v_box_loss:3.34474,v_seg_loss:4.38934,v_cls_loss:4.7545,v_dfl_loss:4.1884,lr_pg0:0.0013398,lr_pg1:0.0004466,lr_pg2:0.0013398,updated_at:"2026-01-27 06:30:17.65778+00",plan_id:4},
            {id:318,batch_no:1,epoch:88,time:562.292,box_loss:3.33178,seg_loss:4.81315,cls_loss:5.08067,dfl_loss:4.22081,box_precision:0.06605,box_recall:0.1,box_map50:0.03759,box_map95:0.00853,m_precision:0.12674,m_recall:0.3,m_map50:0.0802,m_map95:0.01206,v_box_loss:3.26792,v_seg_loss:4.39993,v_cls_loss:4.78752,v_dfl_loss:4.14684,lr_pg0:0.00116046,lr_pg1:0.00038682,lr_pg2:0.00116046,updated_at:"2026-01-27 06:30:17.65779+00",plan_id:4},
            {id:319,batch_no:1,epoch:89,time:628.403,box_loss:3.51164,seg_loss:4.8596,cls_loss:4.77288,dfl_loss:4.22379,box_precision:0.07012,box_recall:0.3,box_map50:0.04904,box_map95:0.0078,m_precision:0.13276,m_recall:0.3,m_map50:0.07008,m_map95:0.01104,v_box_loss:3.17442,v_seg_loss:4.23977,v_cls_loss:4.73455,v_dfl_loss:4.22316,lr_pg0:0.00088608,lr_pg1:0.00029536,lr_pg2:0.00088608,updated_at:"2026-01-27 06:30:17.657804+00",plan_id:4},
            {id:320,batch_no:1,epoch:90,time:691.705,box_loss:3.61771,seg_loss:4.74914,cls_loss:4.96165,dfl_loss:4.21727,box_precision:0.05543,box_recall:0.35,box_map50:0.03687,box_map95:0.00581,m_precision:0.07931,m_recall:0.35,m_map50:0.06041,m_map95:0.00932,v_box_loss:3.20813,v_seg_loss:4.21407,v_cls_loss:4.59859,v_dfl_loss:4.20758,lr_pg0:0.00051666,lr_pg1:0.00017222,lr_pg2:0.00051666,updated_at:"2026-01-27 06:30:17.657813+00",plan_id:4},
            {id:331,batch_no:1,epoch:91,time:81.1418,box_loss:3.42162,seg_loss:5.16747,cls_loss:5.11407,dfl_loss:4.23065,box_precision:0.14809,box_recall:0.05,box_map50:0.03466,box_map95:0.01327,m_precision:0.14809,m_recall:0.05,m_map50:0.03327,m_map95:0.00645,v_box_loss:3.32296,v_seg_loss:4.69395,v_cls_loss:4.94476,v_dfl_loss:4.25196,lr_pg0:0.00042,lr_pg1:0.00014,lr_pg2:0.00042,updated_at:"2026-01-27 06:43:24.376154+00",plan_id:4},
            {id:332,batch_no:1,epoch:92,time:159.011,box_loss:3.53292,seg_loss:5.07518,cls_loss:5.2386,dfl_loss:4.19489,box_precision:0.13729,box_recall:0.05,box_map50:0.05395,box_map95:0.0234,m_precision:0.12157,m_recall:0.05,m_map50:0.05386,m_map95:0.00609,v_box_loss:3.33412,v_seg_loss:4.67848,v_cls_loss:4.91568,v_dfl_loss:4.21618,lr_pg0:0.0008109,lr_pg1:0.0002703,lr_pg2:0.0008109,updated_at:"2026-01-27 06:43:24.376193+00",plan_id:4},
            {id:333,batch_no:1,epoch:93,time:226.964,box_loss:3.57055,seg_loss:4.93089,cls_loss:5.32185,dfl_loss:4.19361,box_precision:0.81293,box_recall:0.15,box_map50:0.1756,box_map95:0.02626,m_precision:0.53302,m_recall:0.1,m_map50:0.09425,m_map95:0.01027,v_box_loss:3.32434,v_seg_loss:4.68244,v_cls_loss:4.7528,v_dfl_loss:4.23825,lr_pg0:0.00110676,lr_pg1:0.00036892,lr_pg2:0.00110676,updated_at:"2026-01-27 06:43:24.376205+00",plan_id:4},
            {id:334,batch_no:1,epoch:94,time:292.629,box_loss:3.50685,seg_loss:5.0563,cls_loss:5.03683,dfl_loss:4.18416,box_precision:0.17668,box_recall:0.2,box_map50:0.0679,box_map95:0.01335,m_precision:0.16079,m_recall:0.18253,m_map50:0.05541,m_map95:0.00555,v_box_loss:3.27991,v_seg_loss:4.60771,v_cls_loss:4.86813,v_dfl_loss:4.21776,lr_pg0:0.00130758,lr_pg1:0.00043586,lr_pg2:0.00130758,updated_at:"2026-01-27 06:43:24.376216+00",plan_id:4},
            {id:335,batch_no:1,epoch:95,time:360.306,box_loss:3.44186,seg_loss:4.96501,cls_loss:4.8373,dfl_loss:4.20916,box_precision:0.38843,box_recall:0.05,box_map50:0.07369,box_map95:0.01705,m_precision:0.29066,m_recall:0.05,m_map50:0.03867,m_map95:0.00632,v_box_loss:3.28391,v_seg_loss:4.46987,v_cls_loss:4.8343,v_dfl_loss:4.2223,lr_pg0:0.00141336,lr_pg1:0.00047112,lr_pg2:0.00141336,updated_at:"2026-01-27 06:43:24.376226+00",plan_id:4},
            {id:336,batch_no:1,epoch:96,time:428.724,box_loss:3.422,seg_loss:4.827,cls_loss:4.91144,dfl_loss:4.18101,box_precision:0.04673,box_recall:0.2,box_map50:0.02577,box_map95:0.0052,m_precision:0.00146,m_recall:0.35,m_map50:0.01327,m_map95:0.00282,v_box_loss:3.29728,v_seg_loss:4.44976,v_cls_loss:4.90444,v_dfl_loss:4.21039,lr_pg0:0.0014241,lr_pg1:0.0004747,lr_pg2:0.0014241,updated_at:"2026-01-27 06:43:24.376235+00",plan_id:4},
            {id:337,batch_no:1,epoch:97,time:495.188,box_loss:3.47941,seg_loss:4.84949,cls_loss:4.74135,dfl_loss:4.19157,box_precision:0.0591,box_recall:0.1,box_map50:0.03619,box_map95:0.0066,m_precision:0.05,m_recall:0.05,m_map50:0.04842,m_map95:0.00724,v_box_loss:3.24349,v_seg_loss:4.39106,v_cls_loss:4.64351,v_dfl_loss:4.18089,lr_pg0:0.0013398,lr_pg1:0.0004466,lr_pg2:0.0013398,updated_at:"2026-01-27 06:43:24.376245+00",plan_id:4},
            {id:338,batch_no:1,epoch:98,time:561.794,box_loss:3.36807,seg_loss:4.76892,cls_loss:4.94351,dfl_loss:4.22407,box_precision:0.09119,box_recall:0.1,box_map50:0.03232,box_map95:0.00731,m_precision:0.13679,m_recall:0.15,m_map50:0.09237,m_map95:0.01473,v_box_loss:3.30874,v_seg_loss:4.29951,v_cls_loss:4.78912,v_dfl_loss:4.11502,lr_pg0:0.00116046,lr_pg1:0.00038682,lr_pg2:0.00116046,updated_at:"2026-01-27 06:43:24.376255+00",plan_id:4},
            {id:339,batch_no:1,epoch:99,time:627.081,box_loss:3.46831,seg_loss:4.83642,cls_loss:4.83134,dfl_loss:4.2257,box_precision:0.15414,box_recall:0.05,box_map50:0.0418,box_map95:0.00717,m_precision:0.17357,m_recall:0.15,m_map50:0.06015,m_map95:0.01182,v_box_loss:3.30954,v_seg_loss:4.23014,v_cls_loss:4.72647,v_dfl_loss:4.15235,lr_pg0:0.00088608,lr_pg1:0.00029536,lr_pg2:0.00088608,updated_at:"2026-01-27 06:43:24.376271+00",plan_id:4},
            {id:340,batch_no:1,epoch:100,time:689.933,box_loss:3.60195,seg_loss:4.76599,cls_loss:4.81471,dfl_loss:4.23194,box_precision:0.66133,box_recall:0.05,box_map50:0.07088,box_map95:0.0096,m_precision:0.10767,m_recall:0.1,m_map50:0.05745,m_map95:0.01188,v_box_loss:3.25534,v_seg_loss:4.17117,v_cls_loss:4.65644,v_dfl_loss:4.1675,lr_pg0:0.00051666,lr_pg1:0.00017222,lr_pg2:0.00051666,updated_at:"2026-01-27 06:43:24.37628+00",plan_id:4}
        ];

// 生成训练数据
export const generateTrainingData = (random=false) => {
  if (!random) {
    const startEpoch = 46
    const endEpoch = 100
      // 直接从SQL数据中筛选指定周期范围的数据
    return SQL_TRAINING_DATA.filter(item =>
      item.epoch >= startEpoch && item.epoch <= endEpoch
    ).sort((a, b) => a.epoch - b.epoch); // 确保按epoch排序
  }

  // 随机生产 
  const data = [];
  for (let epoch = 46; epoch <= 100; epoch++) {
    const trendFactor = (epoch - 46) / 54;
    data.push({
      epoch,
      box_loss: 3.5 - 0.4 * Math.sin(trendFactor * Math.PI * 2) + Math.random() * 0.3,
      seg_loss: 5.8 - 1.2 * trendFactor + Math.random() * 0.5,
      cls_loss: 5.2 - 0.6 * trendFactor + Math.random() * 0.4,
      dfl_loss: 4.3 - 0.2 * trendFactor + Math.random() * 0.2,
      box_precision: 0.1 + 0.4 * trendFactor + Math.random() * 0.1,
      box_recall: 0.2 + 0.3 * trendFactor + Math.random() * 0.15,
      box_map50: 0.05 + 0.4 * trendFactor + Math.random() * 0.1,
      box_map95: 0.01 + 0.2 * trendFactor + Math.random() * 0.05,
      m_precision: 0.2 + 0.3 * trendFactor + Math.random() * 0.2,
      m_recall: 0.15 + 0.25 * trendFactor + Math.random() * 0.15,
      m_map50: 0.02 + 0.3 * trendFactor + Math.random() * 0.1,
      m_map95: 0.002 + 0.1 * trendFactor + Math.random() * 0.05,
      v_box_loss: 3.3 - 0.3 * trendFactor + Math.random() * 0.3,
      v_seg_loss: 5.5 - 1.0 * trendFactor + Math.random() * 0.4,
      v_cls_loss: 5.0 - 0.5 * trendFactor + Math.random() * 0.3,
      v_dfl_loss: 4.2 - 0.2 * trendFactor + Math.random() * 0.2,
      lr_pg0: 0.0014 - 0.001 * trendFactor + Math.random() * 0.0002,
      lr_pg1: 0.00047 - 0.0003 * trendFactor + Math.random() * 0.0001,
      lr_pg2: 0.0014 - 0.001 * trendFactor + Math.random() * 0.0002,
      time: 400 + Math.random() * 300
    });
  }
  return data;
};


export const MOCK_LOG = `
# ================================================================
# Ultralytics YOLOv8 Training Log
# Project: vehicle-detection
# Training Session: train_20240115_090000
# ================================================================

2024-01-15 09:00:00,123 - INFO - Starting YOLOv8 training...
2024-01-15 09:00:00,456 - INFO - Model: yolov8m.pt
2024-01-15 09:00:00,789 - INFO - Dataset: /path/to/dataset/data.yaml
2024-01-15 09:00:01,123 - INFO - Parameters: 
    epochs: 10
    patience: 50
    batch: 16
    imgsz: 640
    save: True
    save_period: -1
    cache: False
    device: null
    workers: 8
    project: null
    name: null
    exist_ok: False
    pretrained: True
    optimizer: auto
    verbose: True
    seed: 0
    deterministic: True
    single_cls: False
    rect: False
    cos_lr: False
    close_mosaic: 10
    resume: False
    amp: True
    fraction: 1.0
    profile: False
    freeze: null
    multi_scale: False
    overlap_mask: True
    mask_ratio: 4
    dropout: 0.0
    val: True
    split: val
    save_json: False
    save_hybrid: False
    conf: null
    iou: 0.7
    max_det: 300
    half: False
    dnn: False
    plots: True
    source: null
    vid_stride: 1
    stream_buffer: False
    visualize: False
    augment: False
    agnostic_nms: False
    retina_masks: False
    embed: null
    show: False
    save_frames: False
    save_txt: False
    save_conf: False
    save_crop: False
    show_labels: True
    show_conf: True
    vid_stride: 1
    line_width: null
    format: torchscript
    keras: False
    optimize: False
    int8: False
    dynamic: False
    simplify: False
    opset: null
    workspace: 4
    nms: False
    lr0: 0.01
    lrf: 0.01
    momentum: 0.937
    weight_decay: 0.0005
    warmup_epochs: 3.0
    warmup_momentum: 0.8
    warmup_bias_lr: 0.1
    box: 7.5
    cls: 0.5
    dfl: 1.5
    pose: 12.0
    kobj: 1.0
    label_smoothing: 0.0
    nbs: 64
    hsv_h: 0.015
    hsv_s: 0.7
    hsv_v: 0.4
    degrees: 0.0
    translate: 0.1
    scale: 0.5
    shear: 0.0
    perspective: 0.0
    flipud: 0.0
    fliplr: 0.5
    mosaic: 1.0
    mixup: 0.0
    copy_paste: 0.0
    auto_augment: randaugment
    erasing: 0.4
    crop_fraction: 1.0
    cfg: null
    tracker: botsort.yaml
    save_dir: runs/detect/train2

2024-01-15 09:00:01,456 - INFO - Train dataset: 1280 images, 12480 instances
2024-01-15 09:00:01,789 - INFO - Val dataset: 320 images, 3120 instances
2024-01-15 09:00:02,123 - INFO - Class distribution: 
    car: 5200
    truck: 1560
    bus: 780
    motorcycle: 1040
    bicycle: 1560
    pedestrian: 2340

2024-01-15 09:00:02,456 - INFO - Starting training for 10 epochs...
2024-01-15 09:00:05,123 - INFO - Epoch 1/10: GPU_mem: 4.12G, box_loss: 3.891, cls_loss: 5.432, dfl_loss: 3.765, Instances: 128, Size: 640
2024-01-15 09:00:30,456 - INFO - Epoch 1 validation: mAP50: 0.057, mAP50-95: 0.012, Precision: 0.123, Recall: 0.235
2024-01-15 09:00:55,123 - INFO - Epoch 2/10: GPU_mem: 4.12G, box_loss: 2.988, cls_loss: 4.568, dfl_loss: 2.877, Instances: 128, Size: 640
2024-01-15 09:01:20,456 - INFO - Epoch 2 validation: mAP50: 0.145, mAP50-95: 0.034, Precision: 0.234, Recall: 0.321
2024-01-15 09:01:45,123 - INFO - Epoch 3/10: GPU_mem: 4.12G, box_loss: 2.457, cls_loss: 4.099, dfl_loss: 2.346, Instances: 128, Size: 640
2024-01-15 09:02:10,456 - INFO - Epoch 3 validation: mAP50: 0.201, mAP50-95: 0.056, Precision: 0.312, Recall: 0.389
2024-01-15 09:02:35,123 - INFO - Epoch 4/10: GPU_mem: 4.12G, box_loss: 2.123, cls_loss: 3.765, dfl_loss: 2.034, Instances: 128, Size: 640
2024-01-15 09:03:00,456 - INFO - Epoch 4 validation: mAP50: 0.267, mAP50-95: 0.089, Precision: 0.389, Recall: 0.456
2024-01-15 09:03:25,123 - INFO - Epoch 5/10: GPU_mem: 4.12G, box_loss: 1.876, cls_loss: 3.432, dfl_loss: 1.789, Instances: 128, Size: 640
2024-01-15 09:03:50,456 - INFO - Epoch 5 validation: mAP50: 0.334, mAP50-95: 0.123, Precision: 0.456, Recall: 0.512
2024-01-15 09:04:15,123 - INFO - Epoch 6/10: GPU_mem: 4.12G, box_loss: 1.654, cls_loss: 3.123, dfl_loss: 1.543, Instances: 128, Size: 640
2024-01-15 09:04:40,456 - INFO - Epoch 6 validation: mAP50: 0.401, mAP50-95: 0.167, Precision: 0.512, Recall: 0.567
2024-01-15 09:05:05,123 - INFO - Epoch 7/10: GPU_mem: 4.12G, box_loss: 1.432, cls_loss: 2.876, dfl_loss: 1.321, Instances: 128, Size: 640
2024-01-15 09:05:30,456 - INFO - Epoch 7 validation: mAP50: 0.467, mAP50-95: 0.201, Precision: 0.567, Recall: 0.612
2024-01-15 09:05:55,123 - INFO - Epoch 8/10: GPU_mem: 4.12G, box_loss: 1.234, cls_loss: 2.654, dfl_loss: 1.123, Instances: 128, Size: 640
2024-01-15 09:06:20,456 - INFO - Epoch 8 validation: mAP50: 0.534, mAP50-95: 0.245, Precision: 0.612, Recall: 0.656
2024-01-15 09:06:45,123 - INFO - Epoch 9/10: GPU_mem: 4.12G, box_loss: 1.065, cls_loss: 2.432, dfl_loss: 0.987, Instances: 128, Size: 640
2024-01-15 09:07:10,456 - INFO - Epoch 9 validation: mAP50: 0.600, mAP50-95: 0.289, Precision: 0.656, Recall: 0.689
2024-01-15 09:07:35,123 - INFO - Epoch 10/10: GPU_mem: 4.12G, box_loss: 0.921, cls_loss: 2.234, dfl_loss: 0.876, Instances: 128, Size: 640
2024-01-15 09:08:00,456 - INFO - Epoch 10 validation: mAP50: 0.667, mAP50-95: 0.334, Precision: 0.689, Recall: 0.712
2024-01-15 09:08:00,789 - INFO - Training completed in 0.250 hours
2024-01-15 09:08:01,123 - INFO - Results saved to runs/detect/train2
2024-01-15 09:08:01,456 - INFO - Best model saved as runs/detect/train2/weights/best.pt
2024-01-15 09:08:01,789 - INFO - Last model saved as runs/detect/train2/weights/last.pt
2024-01-15 09:08:02,123 - INFO - Exporting model to ONNX format...
2024-01-15 09:08:05,456 - INFO - Model exported to runs/detect/train2/weights/best.onnx
2024-01-15 09:08:05,789 - INFO - All processes completed successfully
\u001b[34m [lmtrain: [omFast image access (ping: 0.00.0 ms, read: 6740.51517.3 MB/s, size: 237.6 KB)
\u001b[34m [1mAutoBatcch: [OmComputing optimal batch size for imgsz=640 at 60.8% CUDA memory utilization.
\u001b[K[34m\u001b[1mtrain:\u001b[omscanning /label.158 images, 0 backgrounds, 0 corrupt: 100号
\u001b[K[34m [1mtrain: [omscanning /label.158 images, 0 backgrounds, 0 corrupt: 100号
\u001b[K[34m [1mtrain: [omscanning /label.158 images, 0 backgrounds, 0 corrupt: 100号
[K[34m [1mtrain: [omscanning /label.158 images, 0 backgrounds, 0 corrupt: 100号
[K[34m [1mtrain: [omscanning /label.158 images, 0 backgrounds, 0 corrupt: 100号
-studio/data/training/12/datasets/labels/train...
Image sizes 640 train, 640 val Using 0 dataloader workersLogging results to [1m/label-studio/data/training/12/runs/segment/output_train/epoch-1 [0mStarting training for 10 epochs...Closing dataloader mosaic
`
